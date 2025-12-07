import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymobService } from '../paymob/paymob.service';
import { Decimal } from '@prisma/client/runtime/library';
import {
  InitiateDepositDto,
  WalletPurchaseDto,
  WalletAdjustmentDto,
  TransactionQueryDto,
  DepositPaymentMethod,
} from './dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymobService: PaymobService,
  ) {}

  /**
   * Get or create wallet for a customer
   */
  async getOrCreateWallet(customerId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { customerId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          customerId,
          balance: 0,
          currency: 'EGP',
        },
      });
      this.logger.log(`Created new wallet for customer ${customerId}`);
    }

    return wallet;
  }

  /**
   * Get wallet with balance for customer
   */
  async getWallet(customerId: string) {
    const wallet = await this.getOrCreateWallet(customerId);
    return {
      ...wallet,
      balance: Number(wallet.balance),
      totalDeposits: Number(wallet.totalDeposits),
      totalWithdrawals: Number(wallet.totalWithdrawals),
      totalPurchases: Number(wallet.totalPurchases),
    };
  }

  /**
   * Get wallet balance only
   */
  async getBalance(customerId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(customerId);
    return Number(wallet.balance);
  }

  /**
   * Check if wallet has sufficient balance
   */
  async hasSufficientBalance(customerId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(customerId);
    return balance >= amount;
  }

  /**
   * Initiate deposit (top-up) to wallet via Paymob
   */
  async initiateDeposit(
    customerId: string,
    dto: InitiateDepositDto,
    customerInfo: { email: string; name: string; phone?: string },
  ) {
    const wallet = await this.getOrCreateWallet(customerId);

    if (wallet.isFrozen) {
      throw new ForbiddenException('Wallet is frozen. Contact support.');
    }

    // Check max balance limit if set
    if (wallet.maxBalance) {
      const newBalance = Number(wallet.balance) + dto.amount;
      if (newBalance > Number(wallet.maxBalance)) {
        throw new BadRequestException(
          `Deposit would exceed maximum wallet balance of ${wallet.maxBalance} ${wallet.currency}`,
        );
      }
    }

    // Generate transaction number
    const transactionNumber = await this.generateTransactionNumber();

    // Create pending transaction
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        transactionNumber,
        walletId: wallet.id,
        type: 'DEPOSIT',
        status: 'PENDING',
        amount: dto.amount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance, // Will update after completion
        currency: wallet.currency,
        description: 'Wallet top-up',
        descriptionAr: 'شحن رصيد المحفظة',
        paymentMethod: this.mapPaymentMethod(dto.paymentMethod),
        paymentGateway: 'paymob',
      },
    });

    // Create Paymob payment intention
    const nameParts = customerInfo.name.split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Map deposit payment method to Paymob payment method
    const paymobMethod = dto.paymentMethod === 'card' ? 'card' 
      : dto.paymentMethod === 'wallet' ? 'wallet' 
      : dto.paymentMethod === 'kiosk' ? 'kiosk' 
      : 'card';

    const paymobResponse = await this.paymobService.createPaymentIntention({
      amount: dto.amount,
      currency: wallet.currency,
      orderId: transactionNumber,
      description: `Wallet top-up - ${transactionNumber}`,
      paymentMethod: paymobMethod as any,
      firstName,
      lastName,
      email: customerInfo.email,
      phone: customerInfo.phone || '',
      items: [
        {
          name: 'Wallet Top-up',
          description: 'HBRC Wallet Balance',
          amount: dto.amount,
          quantity: 1,
        },
      ],
    });

    // Update transaction with external ID (convert to string as Paymob may return number)
    await this.prisma.walletTransaction.update({
      where: { id: transaction.id },
      data: {
        externalTransactionId: String(paymobResponse.paymobOrderId),
        metadata: { paymobClientSecret: paymobResponse.clientSecret },
      },
    });

    return {
      transactionNumber,
      amount: dto.amount,
      status: 'PENDING',
      checkoutUrl: paymobResponse.checkoutUrl,
      message: 'Redirect to checkout URL to complete payment',
    };
  }

  /**
   * Complete deposit after successful Paymob payment
   */
  async completeDeposit(transactionNumber: string, externalTransactionId: string) {
    const transaction = await this.prisma.walletTransaction.findUnique({
      where: { transactionNumber },
      include: { wallet: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'PENDING') {
      this.logger.warn(`Transaction ${transactionNumber} already processed: ${transaction.status}`);
      return transaction;
    }

    const amount = Number(transaction.amount);
    const currentBalance = Number(transaction.wallet.balance);
    const newBalance = currentBalance + amount;

    // Update in a transaction
    const [updatedTransaction] = await this.prisma.$transaction([
      this.prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          balanceAfter: newBalance,
          externalTransactionId,
          processedAt: new Date(),
        },
      }),
      this.prisma.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: { increment: amount },
          totalDeposits: { increment: amount },
        },
      }),
    ]);

    this.logger.log(
      `Deposit completed: ${transactionNumber}, amount: ${amount}, new balance: ${newBalance}`,
    );

    return updatedTransaction;
  }

  /**
   * Fail deposit transaction
   */
  async failDeposit(transactionNumber: string, reason?: string) {
    const transaction = await this.prisma.walletTransaction.findUnique({
      where: { transactionNumber },
    });

    if (!transaction || transaction.status !== 'PENDING') {
      return;
    }

    await this.prisma.walletTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        failureReason: reason || 'Payment failed',
        processedAt: new Date(),
      },
    });

    this.logger.log(`Deposit failed: ${transactionNumber}, reason: ${reason}`);
  }

  /**
   * Process wallet purchase (deduct from balance)
   */
  async processPurchase(customerId: string, dto: WalletPurchaseDto) {
    const wallet = await this.getOrCreateWallet(customerId);

    if (wallet.isFrozen) {
      throw new ForbiddenException('Wallet is frozen. Contact support.');
    }

    const currentBalance = Number(wallet.balance);

    if (currentBalance < dto.amount) {
      return {
        success: false,
        transactionNumber: '',
        amount: dto.amount,
        newBalance: currentBalance,
        errorMessage: 'Insufficient balance',
      };
    }

    const transactionNumber = await this.generateTransactionNumber();
    const newBalance = currentBalance - dto.amount;

    // Create and process in a transaction
    const [transaction] = await this.prisma.$transaction([
      this.prisma.walletTransaction.create({
        data: {
          transactionNumber,
          walletId: wallet.id,
          type: 'PURCHASE',
          status: 'COMPLETED',
          amount: dto.amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          currency: wallet.currency,
          description: dto.description || 'Purchase',
          descriptionAr: dto.descriptionAr || 'شراء',
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          processedAt: new Date(),
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: dto.amount },
          totalPurchases: { increment: dto.amount },
        },
      }),
    ]);

    this.logger.log(
      `Purchase processed: ${transactionNumber}, amount: ${dto.amount}, ref: ${dto.referenceType}/${dto.referenceId}`,
    );

    return {
      success: true,
      transactionNumber,
      amount: dto.amount,
      newBalance,
    };
  }

  /**
   * Refund to wallet
   */
  async processRefund(
    customerId: string,
    amount: number,
    referenceType: string,
    referenceId: string,
    description?: string,
  ) {
    const wallet = await this.getOrCreateWallet(customerId);
    const transactionNumber = await this.generateTransactionNumber();
    const currentBalance = Number(wallet.balance);
    const newBalance = currentBalance + amount;

    const [transaction] = await this.prisma.$transaction([
      this.prisma.walletTransaction.create({
        data: {
          transactionNumber,
          walletId: wallet.id,
          type: 'REFUND',
          status: 'COMPLETED',
          amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          currency: wallet.currency,
          description: description || 'Refund',
          descriptionAr: 'استرداد',
          referenceType,
          referenceId,
          processedAt: new Date(),
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
        },
      }),
    ]);

    this.logger.log(`Refund processed: ${transactionNumber}, amount: ${amount}`);

    return transaction;
  }

  /**
   * Admin: Adjust wallet balance manually
   */
  async adjustBalance(dto: WalletAdjustmentDto, adminId: string) {
    const wallet = await this.getOrCreateWallet(dto.customerId);
    const transactionNumber = await this.generateTransactionNumber();
    const currentBalance = Number(wallet.balance);
    const newBalance = currentBalance + dto.amount;

    if (newBalance < 0) {
      throw new BadRequestException('Adjustment would result in negative balance');
    }

    const [transaction] = await this.prisma.$transaction([
      this.prisma.walletTransaction.create({
        data: {
          transactionNumber,
          walletId: wallet.id,
          type: 'ADJUSTMENT',
          status: 'COMPLETED',
          amount: Math.abs(dto.amount),
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          currency: wallet.currency,
          description: dto.reason,
          descriptionAr: dto.reasonAr,
          referenceType: 'admin_adjustment',
          referenceId: adminId,
          processedAt: new Date(),
          metadata: {
            adjustedBy: adminId,
            isCredit: dto.amount > 0,
          },
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
          ...(dto.amount > 0 && { totalDeposits: { increment: Math.abs(dto.amount) } }),
          ...(dto.amount < 0 && { totalWithdrawals: { increment: Math.abs(dto.amount) } }),
        },
      }),
    ]);

    this.logger.log(
      `Balance adjusted by admin ${adminId}: customer ${dto.customerId}, amount: ${dto.amount}`,
    );

    return {
      transactionNumber,
      previousBalance: currentBalance,
      adjustment: dto.amount,
      newBalance,
    };
  }

  /**
   * Admin: Freeze/unfreeze wallet
   */
  async setWalletFrozen(customerId: string, frozen: boolean, reason?: string) {
    const wallet = await this.getOrCreateWallet(customerId);

    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        isFrozen: frozen,
        frozenAt: frozen ? new Date() : null,
        frozenReason: frozen ? reason : null,
      },
    });

    this.logger.log(`Wallet ${wallet.id} ${frozen ? 'frozen' : 'unfrozen'}: ${reason || 'N/A'}`);
  }

  /**
   * Get transaction history for customer
   */
  async getTransactions(customerId: string, query: TransactionQueryDto) {
    const wallet = await this.getOrCreateWallet(customerId);
    const { page = 1, limit = 20, type, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { walletId: wallet.id };
    if (type) where.type = type;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return {
      data: transactions.map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
        balanceBefore: Number(tx.balanceBefore),
        balanceAfter: Number(tx.balanceAfter),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Get all wallets
   */
  async getAllWallets(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [wallets, total] = await Promise.all([
      this.prisma.wallet.findMany({
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.wallet.count(),
    ]);

    return {
      data: wallets.map((w) => ({
        ...w,
        balance: Number(w.balance),
        totalDeposits: Number(w.totalDeposits),
        totalWithdrawals: Number(w.totalWithdrawals),
        totalPurchases: Number(w.totalPurchases),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Sync transaction status with Paymob (for when webhook fails)
   */
  async syncTransactionStatus(transactionId: string, customerId?: string) {
    const transaction = await this.prisma.walletTransaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify ownership if customerId provided
    if (customerId && transaction.wallet.customerId !== customerId) {
      throw new NotFoundException('Transaction not found');
    }

    // Only sync PENDING transactions
    if (transaction.status !== 'PENDING') {
      return {
        message: 'Transaction already processed',
        messageAr: 'تمت معالجة المعاملة بالفعل',
        status: transaction.status,
      };
    }

    // If no external transaction ID, can't verify
    if (!transaction.externalTransactionId) {
      return {
        message: 'No external transaction ID to verify. Please wait for payment to complete.',
        messageAr: 'لا يوجد رقم معاملة خارجي للتحقق. يرجى انتظار اكتمال الدفع.',
        status: transaction.status,
      };
    }

    try {
      // Get status from Paymob using the order/intention ID
      const paymobStatus = await this.paymobService.getTransactionStatus(
        transaction.externalTransactionId,
      );

      if (paymobStatus.success) {
        // Payment was successful, complete the deposit
        const amount = Number(transaction.amount);
        const currentBalance = Number(transaction.wallet.balance);
        const newBalance = currentBalance + amount;

        await this.prisma.$transaction([
          this.prisma.walletTransaction.update({
            where: { id: transaction.id },
            data: {
              status: 'COMPLETED',
              balanceAfter: newBalance,
              processedAt: new Date(),
            },
          }),
          this.prisma.wallet.update({
            where: { id: transaction.walletId },
            data: {
              balance: { increment: amount },
              totalDeposits: { increment: amount },
            },
          }),
        ]);

        this.logger.log(`Transaction ${transaction.transactionNumber} synced as COMPLETED`);

        return {
          message: 'Payment confirmed! Balance updated.',
          messageAr: 'تم تأكيد الدفع! تم تحديث الرصيد.',
          status: 'COMPLETED',
          newBalance,
        };
      } else if (paymobStatus.pending) {
        return {
          message: 'Payment is still being processed. Please try again in a few minutes.',
          messageAr: 'لا يزال الدفع قيد المعالجة. يرجى المحاولة مرة أخرى بعد بضع دقائق.',
          status: 'PENDING',
        };
      } else {
        // Payment failed
        await this.prisma.walletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            failureReason: paymobStatus.errorMessage || 'Payment failed',
            processedAt: new Date(),
          },
        });

        this.logger.log(`Transaction ${transaction.transactionNumber} synced as FAILED`);

        return {
          message: 'Payment was not successful',
          messageAr: 'لم تنجح عملية الدفع',
          status: 'FAILED',
          reason: paymobStatus.errorMessage,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to sync transaction: ${error.message}`, error.stack);
      // If API call fails, return a helpful message instead of throwing
      return {
        message: 'Unable to verify payment status. If you completed payment, please contact support.',
        messageAr: 'تعذر التحقق من حالة الدفع. إذا أكملت الدفع، يرجى الاتصال بالدعم.',
        status: 'PENDING',
        needsSupport: true,
      };
    }
  }

  /**
   * Admin: Manually complete a pending transaction
   */
  async adminCompleteTransaction(transactionId: string, paymentReference?: string) {
    const transaction = await this.prisma.walletTransaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'PENDING') {
      throw new BadRequestException(`Transaction is already ${transaction.status}`);
    }

    if (transaction.type !== 'DEPOSIT') {
      throw new BadRequestException('Only deposit transactions can be completed');
    }

    const amount = Number(transaction.amount);
    const currentBalance = Number(transaction.wallet.balance);
    const newBalance = currentBalance + amount;

    await this.prisma.$transaction([
      this.prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          balanceAfter: newBalance,
          processedAt: new Date(),
          ...(paymentReference && { externalTransactionId: paymentReference }),
          metadata: {
            ...(transaction.metadata as object || {}),
            manuallyCompleted: true,
            completedAt: new Date().toISOString(),
          },
        },
      }),
      this.prisma.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: { increment: amount },
          totalDeposits: { increment: amount },
        },
      }),
    ]);

    this.logger.log(`Transaction ${transaction.transactionNumber} manually completed by admin`);

    return {
      message: 'Transaction completed successfully',
      messageAr: 'تم إكمال المعاملة بنجاح',
      transactionNumber: transaction.transactionNumber,
      amount,
      newBalance,
    };
  }

  /**
   * Generate unique transaction number
   */
  private async generateTransactionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastTransaction = await this.prisma.walletTransaction.findFirst({
      where: {
        transactionNumber: { startsWith: `WTX-${year}-` },
      },
      orderBy: { transactionNumber: 'desc' },
    });

    let sequence = 1;
    if (lastTransaction) {
      const lastSeq = parseInt(lastTransaction.transactionNumber.split('-')[2], 10);
      sequence = lastSeq + 1;
    }

    return `WTX-${year}-${sequence.toString().padStart(6, '0')}`;
  }

  /**
   * Map deposit payment method to PaymentMethod enum
   */
  private mapPaymentMethod(method?: DepositPaymentMethod): any {
    switch (method) {
      case DepositPaymentMethod.CARD:
        return 'CREDIT_CARD';
      case DepositPaymentMethod.WALLET:
        return 'VODAFONE_CASH';
      case DepositPaymentMethod.KIOSK:
        return 'FAWRY';
      default:
        return 'OTHER';
    }
  }
}
