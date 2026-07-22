import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,//Chỉ giữ lại các field được khai báo trong DTO.
    forbidNonWhitelisted: true,//thì thay vì xóa field lạ, NestJS sẽ báo lỗi luôn.
    transform: true,
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
