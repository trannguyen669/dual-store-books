import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookDocument = HydratedDocument<BookDoc>;
//Đây là kiểu dữ liệu đại diện cho một document MongoDB thật.

@Schema({
  collection: 'books',
  timestamps: true,
  minimize: false,
})
export class BookDoc {
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  author!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: Object, default: {} })
  meta!: Record<string, unknown>;
}

export const BookSchema = SchemaFactory.createForClass(BookDoc);
