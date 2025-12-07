import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PublicationsController } from './publications.controller';
import { PublicationsService } from './publications.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size
      },
    }),
  ],
  controllers: [PublicationsController],
  providers: [PublicationsService],
  exports: [PublicationsService],
})
export class PublicationsModule {}
