import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';

import { CreateBookDto } from './dto/create-book.dto';
import { BookSqlEntity } from './entities/book-sql.entity';
import { BookDoc, BookDocument } from './schemas/book.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(BookSqlEntity)
    private readonly bookRepository: Repository<BookSqlEntity>,

    @InjectModel(BookDoc.name)
    private readonly bookModel: Model<BookDocument>,
  ) {}

  async create(createBookDto: CreateBookDto) {
    const sqlBook = this.bookRepository.create({
      title: createBookDto.title,
      author: createBookDto.author,
    });

    const savedSqlBook = await this.bookRepository.save(sqlBook);

    const createdMongoBook = await this.bookModel.create({
      id: savedSqlBook.id,
      title: createBookDto.title,
      author: createBookDto.author,
      tags: createBookDto.tags ?? [],
      meta: {},
    });

    const mongoResponse = {
      id: createdMongoBook.id,
      title: createdMongoBook.title,
      author: createdMongoBook.author,
      tags: createdMongoBook.tags,
      meta: createdMongoBook.meta,
    };

    return {
      id: savedSqlBook.id,
      sql: savedSqlBook,
      mongo: mongoResponse,
    };
  }

  async findOne(id: string) {
    const [sqlBook, mongoBook] = await Promise.all([
      this.bookRepository.findOne({
        where: { id },
      }),

      this.bookModel
        .findOne({ id })
        .select({
          _id: 0,
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
        })
        .lean()
        .exec(),
    ]);

    if (!sqlBook || !mongoBook) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }

    return {
      id,
      sql: sqlBook,
      mongo: {
        id: mongoBook.id,
        title: mongoBook.title,
        author: mongoBook.author,
        tags: mongoBook.tags,
        meta: mongoBook.meta ?? {},
      },
    };
  }
}
