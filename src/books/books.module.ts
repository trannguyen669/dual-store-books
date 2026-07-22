import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { BookSqlEntity } from './entities/book-sql.entity';
import { BookDoc, BookSchema } from './schemas/book.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookSqlEntity]),

    MongooseModule.forFeature([
      {
        name: BookDoc.name,
        schema: BookSchema,
      },
    ]),
  ],
  controllers: [BooksController],
  providers: [BooksService]
})
export class BooksModule {}
