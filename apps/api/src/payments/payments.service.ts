import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto';
import { Payment, PaymentStatus, InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.payment.count();
    const number = (count + 1).toString().padStart(4, '0');
    return `PAY-${year}-${number}`;
  }

  private async updateInvoiceStatus(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) return;

    // Calculate total paid amount
    const paidAmount = invoice.payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const invoiceTotal = Number(invoice.total);

    // Update invoice status based on payment
    let newStatus = invoice.status;

    if (paidAmount >= invoiceTotal) {
      newStatus = InvoiceStatus.PAID;
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: newStatus,
          paidAt: new Date(),
        },
      });
    } else if (paidAmount > 0 && paidAmount < invoiceTotal) {
      // Partially paid - keep as ISSUED or current status
      if (invoice.status === InvoiceStatus.DRAFT) {
        await this.prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: InvoiceStatus.ISSUED },
        });
      }
    }
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    // Verify invoice exists
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: createPaymentDto.invoiceId },
      include: { customer: true, payments: true },
    });

    if (!invoice) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Invoice not found',
        messageAr: 'الفاتورة غير موجودة',
      });
    }

    // Check if invoice is cancelled
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Cannot create payment for cancelled invoice',
        messageAr: 'لا يمكن إنشاء دفع لفاتورة ملغاة',
      });
    }

    // Check if payment amount exceeds remaining balance
    const paidAmount = invoice.payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const remainingBalance = Number(invoice.total) - paidAmount;

    if (createPaymentDto.amount > remainingBalance) {
      throw new BadRequestException({
        statusCode: 400,
        message: `Payment amount (${createPaymentDto.amount}) exceeds remaining balance (${remainingBalance})`,
        messageAr: `مبلغ الدفع (${createPaymentDto.amount}) يتجاوز الرصيد المتبقي (${remainingBalance})`,
      });
    }

    const paymentNumber = await this.generatePaymentNumber();

    const payment = await this.prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId: createPaymentDto.invoiceId,
        customerId: invoice.customerId,
        amount: new Decimal(createPaymentDto.amount),
        currency: createPaymentDto.currency ?? 'EGP',
        method: createPaymentDto.method,
        status: createPaymentDto.status ?? PaymentStatus.PENDING,
        transactionId: createPaymentDto.transactionId,
        referenceNumber: createPaymentDto.referenceNumber,
        paidAt: createPaymentDto.paidAt
          ? new Date(createPaymentDto.paidAt)
          : createPaymentDto.status === PaymentStatus.PAID
            ? new Date()
            : null,
        notes: createPaymentDto.notes,
        notesAr: createPaymentDto.notesAr,
        receiptUrl: createPaymentDto.receiptUrl,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Update invoice status if payment is paid
    if (payment.status === PaymentStatus.PAID) {
      await this.updateInvoiceStatus(createPaymentDto.invoiceId);
    }

    return payment;
  }

  async findAll(filters?: {
    customerId?: string;
    invoiceId?: string;
    status?: PaymentStatus;
  }): Promise<Payment[]> {
    const where: any = {};

    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.invoiceId) where.invoiceId = filters.invoiceId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
            request: {
              select: {
                id: true,
                requestNumber: true,
                title: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Payment with ID "${id}" not found`,
        messageAr: `الدفع برقم "${id}" غير موجود`,
      });
    }

    return payment;
  }

  async findByPaymentNumber(paymentNumber: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { paymentNumber },
      include: {
        invoice: true,
        customer: true,
      },
    });

    if (!payment) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Payment "${paymentNumber}" not found`,
        messageAr: `الدفع "${paymentNumber}" غير موجود`,
      });
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const currentPayment = await this.findOne(id);

    const updateData: any = { ...updatePaymentDto };

    // Handle status-specific timestamps
    if (
      updatePaymentDto.status === PaymentStatus.PAID &&
      !currentPayment.paidAt &&
      !updatePaymentDto.paidAt
    ) {
      updateData.paidAt = new Date();
    }

    if (
      updatePaymentDto.status === PaymentStatus.FAILED &&
      !currentPayment.failedAt &&
      !updatePaymentDto.failedAt
    ) {
      updateData.failedAt = new Date();
    }

    if (
      updatePaymentDto.status === PaymentStatus.REFUNDED &&
      !currentPayment.refundedAt &&
      !updatePaymentDto.refundedAt
    ) {
      updateData.refundedAt = new Date();
    }

    if (updatePaymentDto.amount !== undefined) {
      updateData.amount = new Decimal(updatePaymentDto.amount);
    }

    if (updatePaymentDto.paidAt) {
      updateData.paidAt = new Date(updatePaymentDto.paidAt);
    }

    if (updatePaymentDto.failedAt) {
      updateData.failedAt = new Date(updatePaymentDto.failedAt);
    }

    if (updatePaymentDto.refundedAt) {
      updateData.refundedAt = new Date(updatePaymentDto.refundedAt);
    }

    const payment = await this.prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        invoice: true,
        customer: true,
      },
    });

    // Update invoice status if payment status changed to PAID
    if (
      updatePaymentDto.status === PaymentStatus.PAID &&
      currentPayment.status !== PaymentStatus.PAID
    ) {
      await this.updateInvoiceStatus(payment.invoiceId);
    }

    return payment;
  }

  async remove(id: string): Promise<{ message: string; messageAr: string }> {
    const payment = await this.findOne(id);

    // Don't allow deletion of paid payments
    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Cannot delete paid payment. Consider refunding instead.',
        messageAr: 'لا يمكن حذف دفع مدفوع. يرجى النظر في الاسترداد بدلاً من ذلك.',
      });
    }

    await this.prisma.payment.delete({
      where: { id },
    });

    return {
      message: 'Payment deleted successfully',
      messageAr: 'تم حذف الدفع بنجاح',
    };
  }

  async getPaymentStats(): Promise<{
    total: number;
    byStatus: Record<PaymentStatus, number>;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    refundedAmount: number;
  }> {
    const payments = await this.prisma.payment.findMany();

    const byStatus = payments.reduce(
      (acc, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      },
      {} as Record<PaymentStatus, number>,
    );

    const totalAmount = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    const paidAmount = payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingAmount = payments
      .filter((p) => p.status === PaymentStatus.PENDING)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const refundedAmount = payments
      .filter((p) => p.status === PaymentStatus.REFUNDED)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      total: payments.length,
      byStatus,
      totalAmount,
      paidAmount,
      pendingAmount,
      refundedAmount,
    };
  }
}
