import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { BilingualExceptionFilter } from './common/filters/bilingual-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable bilingual error messages (Arabic + English)
  app.useGlobalFilters(new BilingualExceptionFilter());

  // Enable CORS
  app.enableCors();

  // Serve static files from uploads directory
  // Use process.cwd() to get the project root, not dist folder
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('HBRC API')
    .setDescription('HBRC API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger docs available at: ${await app.getUrl()}/api/docs`);
  console.log(`Static files available at: ${await app.getUrl()}/uploads/`);
}
bootstrap();
