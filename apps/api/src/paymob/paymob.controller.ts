import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
  Req,
  Res,
  Headers,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymobService } from './paymob.service';
import {
  CreatePaymentIntentionDto,
  PaymentIntentionResponseDto,
  PaymobCallbackDto,
  TransactionStatusDto,
  RefundDto,
} from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards';
import { RequirePermissions, Public } from '../common/decorators';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ErrorResponseDto,
} from '../common/dto';

@ApiTags('Payments - Paymob Gateway')
@Controller('paymob')
export class PaymobController {
  private readonly logger = new Logger(PaymobController.name);

  constructor(private readonly paymobService: PaymobService) {}

  @Post('create-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create payment intention',
    description: `
Create a new payment intention with Paymob.
Returns checkout URL to redirect the customer.

**Supported Payment Methods:**
- \`card\` - Credit/Debit Cards
- \`wallet\` - Mobile Wallets (Vodafone Cash, Orange, etc.)
- \`kiosk\` - Aman/Masary Kiosk

**Flow:**
1. Create payment intention with this endpoint
2. Redirect user to the returned \`checkoutUrl\`
3. User completes payment on Paymob
4. Paymob sends webhook callback to update payment status
5. User is redirected back to your returnUrl
    `,
  })
  @ApiBody({
    type: CreatePaymentIntentionDto,
    examples: {
      card: {
        summary: 'Card Payment',
        value: {
          amount: 500,
          currency: 'EGP',
          orderId: 'PUB-2024-001',
          description: 'Purchase of ECP-203 Egyptian Code',
          paymentMethod: 'card',
          firstName: 'Ahmed',
          lastName: 'Mohamed',
          email: 'ahmed@example.com',
          phone: '01012345678',
          returnUrl: 'https://hbrc.gov.eg/payment/success',
        },
      },
      wallet: {
        summary: 'Mobile Wallet Payment',
        value: {
          amount: 250,
          currency: 'EGP',
          orderId: 'INV-2024-001',
          description: 'Invoice Payment',
          paymentMethod: 'wallet',
          firstName: 'Sara',
          lastName: 'Ali',
          email: 'sara@example.com',
          phone: '01098765432',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment intention created successfully',
    type: PaymentIntentionResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedResponseDto })
  async createPayment(@Body() dto: CreatePaymentIntentionDto): Promise<PaymentIntentionResponseDto> {
    return this.paymobService.createPaymentIntention(dto);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Paymob webhook callback',
    description: 'Endpoint for Paymob to send transaction callbacks. This is called automatically by Paymob.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Callback processed' })
  async handleWebhook(
    @Body() body: any,
    @Query('hmac') hmacQuery: string,
    @Headers('hmac') hmacHeader: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const hmac = hmacQuery || hmacHeader;

    this.logger.log(`Received Paymob webhook callback`);
    this.logger.debug(`Callback body: ${JSON.stringify(body)}`);

    try {
      // Verify HMAC if provided
      if (hmac) {
        const obj = body.obj || body;
        const isValid = this.paymobService.verifyHmac(obj, hmac);
        if (!isValid) {
          this.logger.warn('Invalid HMAC signature in callback');
          res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Invalid HMAC' });
          return;
        }
      }

      // Process the callback
      const result = await this.paymobService.handleCallback(body);

      this.logger.log(`Callback processed: transaction=${result.transactionId}, success=${result.success}`);

      res.status(HttpStatus.OK).json({ received: true, ...result });
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      // Always return 200 to Paymob to prevent retries
      res.status(HttpStatus.OK).json({ received: true, error: error.message });
    }
  }

  @Get('callback')
  @Public()
  @ApiOperation({
    summary: 'Paymob redirect callback',
    description: 'Endpoint where users are redirected after payment. Handles redirection to frontend.',
  })
  @ApiQuery({ name: 'success', required: false })
  @ApiQuery({ name: 'id', required: false })
  @ApiQuery({ name: 'pending', required: false })
  @ApiQuery({ name: 'amount_cents', required: false })
  @ApiQuery({ name: 'hmac', required: false })
  async handleRedirectCallback(
    @Query() query: any,
    @Res() res: Response,
  ): Promise<void> {
    const { success, id, pending, amount_cents, order, hmac } = query;

    this.logger.log(`Payment redirect: success=${success}, transaction=${id}, order=${order}`);

    // Verify HMAC for redirection callback
    if (hmac) {
      const isValid = this.paymobService.verifyHmac(query, hmac);
      if (!isValid) {
        this.logger.warn('Invalid HMAC in redirect callback');
      }
    }

    // Determine redirect URL based on payment result
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const isSuccess = success === 'true' || success === true;
    const isPending = pending === 'true' || pending === true;

    let redirectPath = '/payment/result';
    if (isSuccess) {
      redirectPath = `/payment/success?transactionId=${id}&orderId=${order}`;
    } else if (isPending) {
      redirectPath = `/payment/pending?transactionId=${id}&orderId=${order}`;
    } else {
      redirectPath = `/payment/failed?transactionId=${id}&orderId=${order}`;
    }

    res.redirect(`${frontendUrl}${redirectPath}`);
  }

  @Get('transaction/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('payments:read')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get transaction status',
    description: 'Retrieve the status of a transaction from Paymob.',
  })
  @ApiParam({ name: 'id', description: 'Paymob transaction ID' })
  @ApiResponse({ status: HttpStatus.OK, type: TransactionStatusDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundResponseDto })
  async getTransactionStatus(@Param('id') id: string): Promise<TransactionStatusDto> {
    return this.paymobService.getTransactionStatus(id);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('payments:update')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refund a transaction',
    description: 'Process a refund for a completed transaction. Amount must be less than or equal to original amount.',
  })
  @ApiBody({
    type: RefundDto,
    examples: {
      full: {
        summary: 'Full Refund',
        value: {
          transactionId: '123456789',
          amount: 500,
        },
      },
      partial: {
        summary: 'Partial Refund',
        value: {
          transactionId: '123456789',
          amount: 200,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Refund processed successfully',
    schema: {
      properties: {
        success: { type: 'boolean' },
        refundId: { type: 'string' },
      },
    },
  })
  async refundTransaction(@Body() dto: RefundDto): Promise<{ success: boolean; refundId: string }> {
    return this.paymobService.refundTransaction(dto.transactionId, dto.amount);
  }

  @Post('void/:transactionId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('payments:update')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Void a transaction',
    description: 'Void a transaction before settlement. Only works for recent unsettled transactions.',
  })
  @ApiParam({ name: 'transactionId', description: 'Paymob transaction ID to void' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction voided successfully',
    schema: {
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  async voidTransaction(@Param('transactionId') transactionId: string): Promise<{ success: boolean }> {
    return this.paymobService.voidTransaction(transactionId);
  }
}
