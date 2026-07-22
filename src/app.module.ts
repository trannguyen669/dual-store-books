import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { BooksModule } from './books/books.module';

@Module({
  imports: [
     TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'pass',
      database: 'books_db',
      autoLoadEntities: true,
      synchronize: true,
    }),

    MongooseModule.forRoot('mongodb://localhost:27017/books_db'),

    BooksModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
