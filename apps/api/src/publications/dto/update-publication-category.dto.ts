import { PartialType } from '@nestjs/swagger';
import { CreatePublicationCategoryDto } from './create-publication-category.dto';

export class UpdatePublicationCategoryDto extends PartialType(CreatePublicationCategoryDto) {}
