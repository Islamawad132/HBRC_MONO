import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto';
import { Invoice, InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count();
    const number = (count + 1).toString().padStart(4, '0');
    return `INV-${year}-${number}`;
  }

  private calculateTaxAndTotal(
    subtotal: number,
    taxRate: number,
    discount: number,
  ): { taxAmount: number; total: number } {
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discount;
    return { taxAmount, total };
  }

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    // Verify request exists
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: createInvoiceDto.requestId },
      include: { customer: true, invoice: true },
    });

    if (!request) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Service request not found',
        messageAr: 'طلب الخدمة غير موجود',
      });
    }

    // Check if invoice already exists for this request
    if (request.invoice) {
      throw new ConflictException({
        statusCode: 409,
        message: 'Invoice already exists for this request',
        messageAr: 'الفاتورة موجودة بالفعل لهذا الطلب',
      });
    }

    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate tax and total
    const taxRate = createInvoiceDto.taxRate ?? 14.0;
    const discount = createInvoiceDto.discount ?? 0;
    const { taxAmount, total } = this.calculateTaxAndTotal(
      createInvoiceDto.subtotal,
      taxRate,
      discount,
    );

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        requestId: createInvoiceDto.requestId,
        customerId: request.customerId,
        title: createInvoiceDto.title || `Invoice for Request #${request.requestNumber}`,
        titleAr: createInvoiceDto.titleAr || `فاتورة لطلب #${request.requestNumber}`,
        description: createInvoiceDto.description,
        descriptionAr: createInvoiceDto.descriptionAr,
        subtotal: new Decimal(createInvoiceDto.subtotal),
        taxRate: new Decimal(taxRate),
        taxAmount: new Decimal(taxAmount),
        discount: new Decimal(discount),
        total: new Decimal(total),
        currency: createInvoiceDto.currency ?? 'EGP',
        status: createInvoiceDto.status ?? InvoiceStatus.DRAFT,
        dueDate: createInvoiceDto.dueDate
          ? new Date(createInvoiceDto.dueDate)
          : null,
        notes: createInvoiceDto.notes,
        notesAr: createInvoiceDto.notesAr,
      },
      include: {
        request: {
          select: {
            id: true,
            requestNumber: true,
            title: true,
            titleAr: true,
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
        payments: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            method: true,
            status: true,
            paidAt: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    customerId?: string;
    status?: InvoiceStatus;
  }): Promise<Invoice[]> {
    const where: any = {};

    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.invoice.findMany({
      where,
      include: {
        request: {
          select: {
            id: true,
            requestNumber: true,
            title: true,
            titleAr: true,
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
        payments: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            method: true,
            status: true,
            paidAt: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        request: {
          select: {
            id: true,
            requestNumber: true,
            title: true,
            titleAr: true,
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
        payments: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            method: true,
            status: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Invoice with ID "${id}" not found`,
        messageAr: `الفاتورة برقم "${id}" غير موجودة`,
      });
    }

    return invoice;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        request: true,
        customer: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Invoice "${invoiceNumber}" not found`,
        messageAr: `الفاتورة "${invoiceNumber}" غير موجودة`,
      });
    }

    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    await this.findOne(id);

    const updateData: any = { ...updateInvoiceDto };

    // Recalculate if financial fields changed
    if (
      updateInvoiceDto.subtotal !== undefined ||
      updateInvoiceDto.taxRate !== undefined ||
      updateInvoiceDto.discount !== undefined
    ) {
      const invoice = await this.prisma.invoice.findUnique({ where: { id } });
      if (!invoice) {
        throw new NotFoundException({
          statusCode: 404,
          message: `Invoice with ID "${id}" not found`,
          messageAr: `الفاتورة برقم "${id}" غير موجودة`,
        });
      }
      const subtotal =
        updateInvoiceDto.subtotal !== undefined
          ? updateInvoiceDto.subtotal
          : Number(invoice.subtotal);
      const taxRate =
        updateInvoiceDto.taxRate !== undefined
          ? updateInvoiceDto.taxRate
          : Number(invoice.taxRate);
      const discount =
        updateInvoiceDto.discount !== undefined
          ? updateInvoiceDto.discount
          : Number(invoice.discount);

      const { taxAmount, total } = this.calculateTaxAndTotal(
        subtotal,
        taxRate,
        discount,
      );

      updateData.subtotal = new Decimal(subtotal);
      updateData.taxRate = new Decimal(taxRate);
      updateData.discount = new Decimal(discount);
      updateData.taxAmount = new Decimal(taxAmount);
      updateData.total = new Decimal(total);
    }

    // Handle status-specific timestamps
    if (updateInvoiceDto.status === InvoiceStatus.ISSUED && !updateData.issuedAt) {
      updateData.issuedAt = new Date();
    }

    if (updateInvoiceDto.status === InvoiceStatus.SENT && !updateData.sentAt) {
      updateData.sentAt = new Date();
    }

    if (updateInvoiceDto.status === InvoiceStatus.PAID && !updateData.paidAt) {
      updateData.paidAt = new Date();
    }

    if (updateInvoiceDto.dueDate) {
      updateData.dueDate = new Date(updateInvoiceDto.dueDate);
    }

    return this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        request: true,
        customer: true,
        payments: true,
      },
    });
  }

  async remove(id: string): Promise<{ message: string; messageAr: string }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Invoice with ID "${id}" not found`,
        messageAr: `الفاتورة برقم "${id}" غير موجودة`,
      });
    }

    // Check if invoice has payments
    if (invoice.payments && invoice.payments.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Cannot delete invoice with associated payments',
        messageAr: 'لا يمكن حذف فاتورة لها مدفوعات مرتبطة',
      });
    }

    await this.prisma.invoice.delete({
      where: { id },
    });

    return {
      message: 'Invoice deleted successfully',
      messageAr: 'تم حذف الفاتورة بنجاح',
    };
  }

  async getInvoiceStats(): Promise<{
    total: number;
    byStatus: Record<InvoiceStatus, number>;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    overdueCount: number;
  }> {
    const invoices = await this.prisma.invoice.findMany();

    const byStatus = invoices.reduce(
      (acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      },
      {} as Record<InvoiceStatus, number>,
    );

    const totalAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0,
    );

    const paidAmount = invoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + Number(inv.total), 0);

    const unpaidAmount = totalAmount - paidAmount;

    const now = new Date();
    const overdueCount = invoices.filter(
      (inv) =>
        inv.dueDate &&
        inv.dueDate < now &&
        inv.status !== InvoiceStatus.PAID &&
        inv.status !== InvoiceStatus.CANCELLED,
    ).length;

    return {
      total: invoices.length,
      byStatus,
      totalAmount,
      paidAmount,
      unpaidAmount,
      overdueCount,
    };
  }
}
