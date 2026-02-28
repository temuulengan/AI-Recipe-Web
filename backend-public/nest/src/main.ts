import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ErrorLogService } from './log/log.service';
import { AllExceptionsFilter } from './log/all-exceptions.fillter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const errorLogService = app.get(ErrorLogService);

  app.useGlobalFilters(new AllExceptionsFilter(errorLogService));

  // 글로벌 유효성 검증 파이프 설정
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // CORS 설정
  app.enableCors();

  // 정적 파일 서빙 설정 (업로드된 이미지 파일들)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3000);
  console.log('🚀 Server running on port 3000');
}
bootstrap();
