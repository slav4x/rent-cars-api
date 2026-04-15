# Rent Cars API

API проекта на Express + PostgreSQL.

## Стек

- Express 5
- PostgreSQL
- TypeScript
- Zod
- Sharp
- S3-compatible storage

## Запуск локально

1. Установить зависимости:

```bash
npm install
```

2. Поднять локальную PostgreSQL:

```bash
npm run db:up
```

3. Создать env:

```bash
cp .env.example .env
```

4. Запустить API:

```bash
npm run dev
```

## Команды

```bash
npm run dev
npm run build
npm run start
npm run db:up
npm run db:down
```

## Основные возможности

- auth: `register`, `login`, `refresh`, `logout`
- роли и защита panel/account-роутов
- профиль пользователя и аватар
- верификация с приватными документами
- избранное пользователя
- справочники и CRUD автомобилей
- публичные `/api/cars` и `/api/cars/:slug`
- загрузка медиа автомобилей

## Переменные окружения

- `PORT` — порт API
- `CLIENT_ORIGIN` — один или несколько origin через запятую
- `DATABASE_URL` — строка подключения к PostgreSQL
- `DATABASE_SSL` — SSL для managed Postgres
- `AUTH_TOKEN_SECRET` — секрет подписи access token
- `AUTH_TOKEN_TTL_SECONDS` — TTL access token
- `REFRESH_TOKEN_TTL_SECONDS` — TTL refresh token
- `UPLOADS_DIR` — локальная папка для публичных файлов
- `PRIVATE_STORAGE_DIR` — локальная папка для приватных файлов
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_BASE_URL`

## Локальная база

- по умолчанию используется `postgresql://rentcars:rentcars@localhost:5432/rentcars`
- схема лежит в `src/db/schema.sql`
- схема применяется при старте API автоматически
- новые таблицы и индексы подтягиваются сами
- изменения существующих колонок нужно мигрировать отдельно SQL-командами

## Файлы и загрузки

- аватары сохраняются как `jpg`, центр-кроп `600x600`, со сжатием
- изображения автомобилей сохраняются как `jpg`, максимум `1600x1600`, со сжатием
- видео автомобилей сохраняются без конвертации
- документы верификации хранятся приватно
- в production без явных путей локальное хранилище уходит в `/tmp/rent-cars-api/...`
- если заданы `S3_*`, публичные и приватные файлы сохраняются в S3

## Безопасность

- обязательная валидация env на старте
- CORS по списку разрешённых origin
- rate limit на `register`, `login`, `reset-password`
- role-based доступ к `/api/panel/*`
- refresh token хранится отдельной серверной сессией
- dev-роут `/api/dev/users` отключён в production

## Роли

- `guest`
- `user`
- `manager`
- `admin`

## Статусы верификации

- `inactive`
- `pending`
- `verified`
- `rejected`

## Timeweb Cloud

- укажи `DATABASE_URL` от managed PostgreSQL
- включи `DATABASE_SSL=true`, если кластер требует TLS
- `CLIENT_ORIGIN` задавай без хвостового `/`
- для object storage укажи `S3_*` переменные
- не рассчитывай на запись в `/app/...`, для этого уже есть `/tmp` fallback или S3
