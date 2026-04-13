# Rent Cars API

Локальный API для разработки фронтенда и постепенной замены моков.

## Возможности

- `GET /health` - проверка, что сервер жив
- `POST /api/auth/register` - регистрация пользователя
- `POST /api/auth/login` - вход
- `POST /api/auth/reset-password` - имитация сброса пароля
- `GET /api/dev/users` - список пользователей из локальной SQLite-базы без паролей

## Запуск

1. Установить зависимости:

```bash
npm install
```

2. Создать env:

```bash
cp .env.example .env
```

3. Запустить dev-сервер:

```bash
npm run dev
```

## Переменные окружения

- `PORT` - порт API, по умолчанию `4000`
- `CLIENT_ORIGIN` - origin фронтенда для CORS
- `DATABASE_PATH` - путь до SQLite-файла
- `AUTH_TOKEN_SECRET` - секрет для подписи auth-токенов
- `AUTH_TOKEN_TTL_SECONDS` - срок жизни токена в секундах

## Локальная БД

- База создается автоматически при старте
- Файл по умолчанию: `./data/rent-cars.sqlite`
- Схема лежит в `src/db/schema.sql`
- Auth использует подписанный токен, поэтому `AUTH_TOKEN_SECRET` должен совпадать с настройкой во фронтенде

## Примеры запросов

Регистрация:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Slava",
    "lastName": "Dev",
    "phone": "+79990000000",
    "email": "slava@example.com",
    "password": "secret123"
  }'
```

Вход:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "slava@example.com",
    "password": "secret123"
  }'
```
