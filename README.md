# Dual Store Books

Ứng dụng NestJS minh họa cùng một business object `Book` được ghi vào hai kiểu lưu trữ khác nhau:

- PostgreSQL qua TypeORM: lưu relational row chặt chẽ, không có `tags`/`meta`.
- MongoDB qua Mongoose: lưu document linh hoạt, có `tags` và `meta`.

Một request `POST /books` ghi kép vào cả hai engine. Một request `GET /books/:id` đọc lại cùng `id` từ cả hai engine để thấy cùng dữ liệu nhưng ở hai shape khác nhau.

## Tech Stack

- NestJS
- TypeORM + PostgreSQL
- Mongoose + MongoDB
- Docker Compose

## Chạy Database

```bash
docker compose up -d
```

`docker-compose.yml` tạo hai service:

- PostgreSQL: `localhost:5432`, database `books_db`, user `postgres`, password lấy từ file `.env` local
- MongoDB: `localhost:27017`, database `books_db`

## Cài Đặt Và Chạy App

```bash
npm install
copy .env.example .env
npm run start:dev
```

App chạy mặc định ở:

```text
http://localhost:3000
```

## Kết Nối Database

Kết nối được khai báo trong `AppModule`:

- `ConfigModule`: `src/app.module.ts:10`
- TypeORM PostgreSQL: `src/app.module.ts:14`
- Mongoose MongoDB: `src/app.module.ts:31`
- `BooksModule`: `src/app.module.ts:42`

```ts
ConfigModule.forRoot({
  isGlobal: true,
})

TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get<string>('POSTGRES_HOST', 'localhost'),
    port: Number(configService.get<string>('POSTGRES_PORT', '5432')),
    username: configService.get<string>('POSTGRES_USER', 'postgres'),
    password: configService.getOrThrow<string>('POSTGRES_PASSWORD'),
    database: configService.get<string>('POSTGRES_DB', 'books_db'),
    autoLoadEntities: true,
    synchronize: configService.get<string>('TYPEORM_SYNC', 'true') === 'true',
  }),
})

MongooseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    uri: configService.getOrThrow<string>('MONGO_URI'),
  }),
})
```

File `.env` dùng khi chạy local và không commit lên Git. File `.env.example` được commit để người khác biết các biến môi trường cần khai báo:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=books_db
TYPEORM_SYNC=true
MONGO_URI=your_mongodb_connection_string
```

## Data Model

### Relational Entity

File: `src/books/entities/book-sql.entity.ts`

`BookSqlEntity` được map vào bảng `books`:

- `id`: primary key UUID
- `title`: varchar
- `author`: varchar
- `createdAt`: timestamp

Entity SQL không có `tags` và không có `meta`.

### Mongo Schema

File: `src/books/schemas/book.schema.ts`

`BookDoc` được map vào collection `books`:

- `id`: relational id dùng chung để liên kết với row SQL
- `title`
- `author`
- `tags`: array string
- `meta`: object

Mongo schema bật `minimize: false` để giữ được `meta: {}` trong document.

## API Contract

### POST /books

Request body:

```json
{
  "title": "Clean Code",
  "author": "Robert Martin",
  "tags": ["classic", "oop"]
}
```

Response `201 Created`:

```json
{
  "id": "relational-primary-key",
  "sql": {
    "id": "relational-primary-key",
    "title": "Clean Code",
    "author": "Robert Martin",
    "createdAt": "2026-07-22T04:13:02.935Z"
  },
  "mongo": {
    "id": "relational-primary-key",
    "title": "Clean Code",
    "author": "Robert Martin",
    "tags": ["classic", "oop"],
    "meta": {}
  }
}
```

### GET /books/:id

Response `200 OK` trả cùng shape:

```json
{
  "id": "relational-primary-key",
  "sql": {
    "id": "relational-primary-key",
    "title": "Clean Code",
    "author": "Robert Martin",
    "createdAt": "2026-07-22T04:13:02.935Z"
  },
  "mongo": {
    "id": "relational-primary-key",
    "title": "Clean Code",
    "author": "Robert Martin",
    "tags": ["classic", "oop"],
    "meta": {}
  }
}
```

Nếu thiếu row SQL hoặc thiếu document Mongo theo cùng `id`, service trả `404 Not Found`.

## Smoke Test

Smoke test thực tế đã chạy với app ở `http://localhost:3000`.

### POST /books

Command PowerShell:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/books" `
  -Method Post `
  -Body (@{
    title = "Clean Code"
    author = "Robert Martin"
    tags = @("classic","oop")
  } | ConvertTo-Json) `
  -ContentType "application/json"
```

Response thật:

```json
{
  "id": "58fa0ba9-7d6c-452a-8391-df4ca4c0877c",
  "sql": {
    "id": "58fa0ba9-7d6c-452a-8391-df4ca4c0877c",
    "title": "Clean Code",
    "author": "Robert Martin",
    "createdAt": "2026-07-22T04:13:02.935Z"
  },
  "mongo": {
    "id": "58fa0ba9-7d6c-452a-8391-df4ca4c0877c",
    "title": "Clean Code",
    "author": "Robert Martin",
    "tags": ["classic", "oop"],
    "meta": {}
  }
}
```

### GET /books/:id

Command PowerShell:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/books/58fa0ba9-7d6c-452a-8391-df4ca4c0877c" `
  -Method Get
```

Response thật:

```json
{
  "id": "58fa0ba9-7d6c-452a-8391-df4ca4c0877c",
  "sql": {
    "id": "58fa0ba9-7d6c-452a-8391-df4ca4c0877c",
    "title": "Clean Code",
    "author": "Robert Martin",
    "createdAt": "2026-07-22T04:13:02.935Z"
  },
  "mongo": {
    "id": "58fa0ba9-7d6c-452a-8391-df4ca4c0877c",
    "title": "Clean Code",
    "author": "Robert Martin",
    "tags": ["classic", "oop"],
    "meta": {}
  }
}
```

### GET id không tồn tại

Command:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/books/00000000-0000-0000-0000-000000000000" `
  -Method Get
```

Response:

```json
{
  "message": "Book with id 00000000-0000-0000-0000-000000000000 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

## Kiểm Tra Trực Tiếp Database

### PostgreSQL

Command:

```bash
docker exec dual-books-postgres psql -U postgres -d books_db -c "SELECT id, title, author FROM books WHERE id = '58fa0ba9-7d6c-452a-8391-df4ca4c0877c';"
```

Output thật:

```text
                  id                  |   title    |    author
--------------------------------------+------------+---------------
 58fa0ba9-7d6c-452a-8391-df4ca4c0877c | Clean Code | Robert Martin
(1 row)
```

### MongoDB

Command:

```bash
docker exec dual-books-mongo mongosh books_db --quiet --eval "db.books.findOne({id: '58fa0ba9-7d6c-452a-8391-df4ca4c0877c'}, {_id:0, __v:0})"
```

Output thật:

```js
{
  id: '58fa0ba9-7d6c-452a-8391-df4ca4c0877c',
  title: 'Clean Code',
  author: 'Robert Martin',
  tags: [ 'classic', 'oop' ],
  meta: {},
  createdAt: ISODate('2026-07-22T04:13:02.952Z'),
  updatedAt: ISODate('2026-07-22T04:13:02.952Z')
}
```

## Code Execution Trace

### POST /books

1. `src/books/books.controller.ts:10` nhận request `POST /books`.
2. `src/books/books.controller.ts:11` lấy body theo `CreateBookDto`.
3. `src/books/books.controller.ts:12` gọi `BooksService.create(createBookDto)`.
4. `src/books/books.service.ts:21` bắt đầu service method `create`.
5. `src/books/books.service.ts:22` tạo SQL entity chỉ với `title` và `author`.
6. `src/books/books.service.ts:27` lưu relational row bằng TypeORM repository và lấy `savedSqlBook.id`.
7. `src/books/books.service.ts:29` tạo Mongo document bằng Mongoose model, dùng lại chính `savedSqlBook.id`.
8. `src/books/books.service.ts:37` chuẩn hóa Mongo response chỉ còn `id`, `title`, `author`, `tags`, `meta`.
9. `src/books/books.service.ts:45` trả contract `{ id, sql, mongo }`.

### GET /books/:id

1. `src/books/books.controller.ts:15` nhận request `GET /books/:id`.
2. `src/books/books.controller.ts:16` lấy `id` từ route param.
3. `src/books/books.controller.ts:17` gọi `BooksService.findOne(id)`.
4. `src/books/books.service.ts:52` bắt đầu service method `findOne`.
5. `src/books/books.service.ts:54` đọc relational row bằng TypeORM repository theo `id`.
6. `src/books/books.service.ts:58` đọc Mongo document bằng Mongoose model theo cùng `id`.
7. `src/books/books.service.ts:70` nếu thiếu một trong hai bên thì throw `NotFoundException`.
8. `src/books/books.service.ts:74` trả contract `{ id, sql, mongo }`.

## So Sánh Relational Vs Document

| Payload/API field | Relational row PostgreSQL | Mongo document |
| --- | --- | --- |
| `id` | Primary key UUID, sinh bởi PostgreSQL/TypeORM | Field `id`, lưu lại cùng relational PK |
| `title` | Cột `varchar(255)` | Field string |
| `author` | Cột `varchar(255)` | Field string |
| `createdAt` | Cột timestamp tự sinh bởi TypeORM | Có timestamp nội bộ của Mongoose nhưng không trả trong API contract |
| `tags` | Không lưu | Array string |
| `meta` | Không lưu | Object |

Điểm chính của bài: cùng một payload được ghi vào cả hai engine, nhưng SQL response cố ý không có `tags/meta`, còn Mongo response bắt buộc có `tags/meta` để thể hiện sự khác nhau giữa relational model và document model.

## Kết Quả Kiểm Tra

```bash
npm run build
```

Kết quả: build thành công.
