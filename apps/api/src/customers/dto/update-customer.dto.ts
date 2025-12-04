import { PartialType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateCustomerDto extends PartialType(
  OmitType(CreateCustomerDto, ['password', 'email'] as const),
) {}
