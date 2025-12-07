import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards';
import { RequirePermissions, Public } from '../common/decorators';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ErrorResponseDto,
} from '../common/dto';
import { WalletService } from './wallet.service';
import {
  InitiateDepositDto,
  WalletPurchaseDto,
  WalletAdjustmentDto,
  TransactionQueryDto,
  WalletResponseDto,
  WalletTransactionResponseDto,
  DepositResponseDto,
  PurchaseResultDto,
} from './dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // ============================================
  // CUSTOMER ENDPOINTS
  // ============================================

  @Get('my-wallet')
  @ApiOperation({
    summary: 'Get my wallet',
    description: `
Get the current customer's wallet information including balance and stats.

**Authentication Required:** Customer JWT token
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet retrieved successfully',
    type: WalletResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  async getMyWallet(@Req() req: any) {
    const customerId = req.user.id;
    return this.walletService.getWallet(customerId);
  }

  @Get('balance')
  @ApiOperation({
    summary: 'Get wallet balance',
    description: 'Get only the current balance of the customer wallet',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Balance retrieved',
    schema: {
      type: 'object',
      properties: {
        balance: { type: 'number', example: 500.0 },
        currency: { type: 'string', example: 'EGP' },
      },
    },
  })
  async getBalance(@Req() req: any) {
    const customerId = req.user.id;
    const balance = await this.walletService.getBalance(customerId);
    return { balance, currency: 'EGP' };
  }

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate wallet deposit',
    description: `
Initiate a deposit (top-up) to the customer's wallet.

**Payment Methods:**
- \`card\` - Credit/Debit card via Paymob
- \`wallet\` - Mobile wallet (Vodafone Cash, etc.)
- \`kiosk\` - Pay at Aman/Masary kiosk

Returns a checkout URL to complete the payment.
    `,
  })
  @ApiBody({
    type: InitiateDepositDto,
    examples: {
      card: {
        summary: 'Card deposit',
        value: { amount: 100, paymentMethod: 'card' },
      },
      wallet: {
        summary: 'Mobile wallet',
        value: { amount: 50, paymentMethod: 'wallet' },
      },
      kiosk: {
        summary: 'Kiosk payment',
        value: { amount: 200, paymentMethod: 'kiosk' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deposit initiated, redirect to checkout',
    type: DepositResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid amount or wallet frozen',
    type: ErrorResponseDto,
  })
  async initiateDeposit(@Req() req: any, @Body() dto: InitiateDepositDto) {
    const customer = req.user;
    return this.walletService.initiateDeposit(customer.id, dto, {
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
    });
  }

  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Purchase using wallet balance',
    description: `
Deduct amount from wallet for a purchase.

Used internally when customer chooses to pay with wallet balance.
    `,
  })
  @ApiBody({ type: WalletPurchaseDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase processed',
    type: PurchaseResultDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Insufficient balance or wallet frozen',
    type: ErrorResponseDto,
  })
  async processPurchase(@Req() req: any, @Body() dto: WalletPurchaseDto) {
    const customerId = req.user.id;
    return this.walletService.processPurchase(customerId, dto);
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'Get transaction history',
    description: 'Get paginated list of wallet transactions',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['DEPOSIT', 'WITHDRAWAL', 'PURCHASE', 'REFUND', 'ADJUSTMENT'] })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transactions retrieved',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/WalletTransactionResponseDto' } },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async getTransactions(@Req() req: any, @Query() query: TransactionQueryDto) {
    const customerId = req.user.id;
    return this.walletService.getTransactions(customerId, query);
  }

  @Get('check-balance/:amount')
  @ApiOperation({
    summary: 'Check if balance is sufficient',
    description: 'Check if wallet has enough balance for a given amount',
  })
  @ApiParam({ name: 'amount', type: Number, example: 50 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Balance check result',
    schema: {
      type: 'object',
      properties: {
        sufficient: { type: 'boolean' },
        currentBalance: { type: 'number' },
        requiredAmount: { type: 'number' },
        shortfall: { type: 'number' },
      },
    },
  })
  async checkBalance(@Req() req: any, @Param('amount') amount: string) {
    const customerId = req.user.id;
    const requiredAmount = parseFloat(amount);
    const currentBalance = await this.walletService.getBalance(customerId);
    const sufficient = currentBalance >= requiredAmount;

    return {
      sufficient,
      currentBalance,
      requiredAmount,
      shortfall: sufficient ? 0 : requiredAmount - currentBalance,
    };
  }

  @Post('transactions/:id/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync transaction status with payment gateway',
    description: `
Manually sync a pending transaction status with Paymob.
Use this if the webhook failed or payment status is not updated.

**Note:** Only works for PENDING transactions with an external transaction ID.
    `,
  })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction synced',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        status: { type: 'string' },
        newBalance: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction not found',
    type: NotFoundResponseDto,
  })
  async syncTransaction(@Req() req: any, @Param('id') id: string) {
    const customerId = req.user.id;
    return this.walletService.syncTransactionStatus(id, customerId);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Get('admin/all')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('wallet:read')
  @ApiOperation({
    summary: 'Get all wallets (Admin)',
    description: 'Admin endpoint to view all customer wallets',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallets retrieved',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ForbiddenResponseDto,
  })
  async getAllWallets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getAllWallets(
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    );
  }

  @Get('admin/customer/:customerId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('wallet:read')
  @ApiOperation({
    summary: 'Get customer wallet (Admin)',
    description: 'Admin endpoint to view a specific customer wallet',
  })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet retrieved',
    type: WalletResponseDto,
  })
  async getCustomerWallet(@Param('customerId') customerId: string) {
    return this.walletService.getWallet(customerId);
  }

  @Get('admin/customer/:customerId/transactions')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('wallet:read')
  @ApiOperation({
    summary: 'Get customer transactions (Admin)',
    description: 'Admin endpoint to view customer transaction history',
  })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  async getCustomerTransactions(
    @Param('customerId') customerId: string,
    @Query() query: TransactionQueryDto,
  ) {
    return this.walletService.getTransactions(customerId, query);
  }

  @Post('admin/adjust')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PermissionsGuard)
  @RequirePermissions('wallet:update')
  @ApiOperation({
    summary: 'Adjust wallet balance (Admin)',
    description: `
Admin endpoint to manually adjust a customer's wallet balance.

Use positive amount to add, negative to subtract.
    `,
  })
  @ApiBody({
    type: WalletAdjustmentDto,
    examples: {
      addBalance: {
        summary: 'Add balance',
        value: {
          customerId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 100,
          reason: 'Promotional credit',
          reasonAr: 'رصيد ترويجي',
        },
      },
      deductBalance: {
        summary: 'Deduct balance',
        value: {
          customerId: '550e8400-e29b-41d4-a716-446655440000',
          amount: -50,
          reason: 'Chargeback correction',
          reasonAr: 'تصحيح استرداد',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Balance adjusted',
    schema: {
      type: 'object',
      properties: {
        transactionNumber: { type: 'string' },
        previousBalance: { type: 'number' },
        adjustment: { type: 'number' },
        newBalance: { type: 'number' },
      },
    },
  })
  async adjustBalance(@Req() req: any, @Body() dto: WalletAdjustmentDto) {
    const adminId = req.user.id;
    return this.walletService.adjustBalance(dto, adminId);
  }

  @Post('admin/transactions/:id/complete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PermissionsGuard)
  @RequirePermissions('wallet:update')
  @ApiOperation({
    summary: 'Manually complete a pending transaction (Admin)',
    description: `
Admin endpoint to manually mark a pending deposit as completed.
Use this when payment was verified externally but webhook failed.
    `,
  })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentReference: { type: 'string', description: 'External payment reference/ID' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction completed',
  })
  async adminCompleteTransaction(
    @Param('id') id: string,
    @Body('paymentReference') paymentReference?: string,
  ) {
    return this.walletService.adminCompleteTransaction(id, paymentReference);
  }

  @Post('admin/freeze/:customerId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PermissionsGuard)
  @RequirePermissions('wallet:update')
  @ApiOperation({
    summary: 'Freeze customer wallet (Admin)',
    description: 'Freeze a customer wallet to prevent transactions',
  })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', example: 'Suspicious activity' },
      },
    },
  })
  async freezeWallet(
    @Param('customerId') customerId: string,
    @Body('reason') reason: string,
  ) {
    await this.walletService.setWalletFrozen(customerId, true, reason);
    return { message: 'Wallet frozen successfully' };
  }

  @Post('admin/unfreeze/:customerId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PermissionsGuard)
  @RequirePermissions('wallet:update')
  @ApiOperation({
    summary: 'Unfreeze customer wallet (Admin)',
    description: 'Unfreeze a customer wallet',
  })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  async unfreezeWallet(@Param('customerId') customerId: string) {
    await this.walletService.setWalletFrozen(customerId, false);
    return { message: 'Wallet unfrozen successfully' };
  }
}
