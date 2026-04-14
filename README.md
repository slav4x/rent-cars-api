# Rent Cars API

Локальный API для разработки фронтенда и постепенной замены моков.

## Возможности

- `GET /health` - проверка, что сервер жив
- `POST /api/auth/register` - регистрация пользователя
- `POST /api/auth/login` - вход
- `POST /api/auth/reset-password` - имитация сброса пароля
- `GET /api/dev/users` - список пользователей из локальной PostgreSQL-базы без паролей
- `GET /api/panel/admins` - список пользователей для админки, кроме ролей `user` и `guest`
- `GET /api/panel/users` - список обычных пользователей с ролью `user`
- `GET /api/panel/car-options` - справочники категорий, городов, марок, цветов и типов кузова
- `GET /api/panel/cars` - список автомобилей для админки
- `GET /api/panel/cars/:id` - получить автомобиль для редактора
- `POST /api/panel/cars` - создать автомобиль
- `PATCH /api/panel/cars/:id` - обновить автомобиль
- `POST /api/panel/cars/media` - загрузить фото или видео автомобиля
- `GET /api/cars` - публичный список автомобилей для сайта и ЛК
- `GET /api/cars/:slug` - публичная карточка автомобиля по slug
- `GET /api/account/favorites` - избранные автомобили пользователя
- `GET /api/account/favorite-ids` - только ID избранных автомобилей
- `POST /api/account/favorites/:carId` - добавить авто в избранное
- `DELETE /api/account/favorites/:carId` - убрать авто из избранного

## Запуск

1. Установить зависимости:

```bash
npm install
```

2. Поднять локальный PostgreSQL:

```bash
npm run db:up
```

3. Создать env:

```bash
cp .env.example .env
```

4. Запустить dev-сервер:

```bash
npm run dev
```

## Переменные окружения

- `PORT` - порт API, по умолчанию `4000`
- `CLIENT_ORIGIN` - origin фронтенда для CORS
- `DATABASE_URL` - строка подключения к PostgreSQL
- `DATABASE_SSL` - включить SSL для managed Postgres, например Timeweb Cloud
- `AUTH_TOKEN_SECRET` - секрет для подписи auth-токенов
- `AUTH_TOKEN_TTL_SECONDS` - срок жизни токена в секундах
- `UPLOADS_DIR` - папка для сохранения аватаров и других файлов
- `PRIVATE_STORAGE_DIR` - приватная папка для документов верификации

## Локальная БД

- База инициализируется автоматически при старте API
- Локально Postgres поднимается через `docker compose` из `docker-compose.yml`
- По умолчанию используется `postgresql://rentcars:rentcars@localhost:5432/rentcars`
- Схема лежит в `src/db/schema.sql`
- Auth использует подписанный токен, поэтому `AUTH_TOKEN_SECRET` должен совпадать с настройкой во фронтенде
- Аватары сохраняются в `./uploads/avatars` и раздаются через `/uploads/...`
- Медиа автомобилей сохраняются в `./uploads/cars` и раздаются через `/uploads/...`
- Документы верификации сохраняются приватно в `./storage/verification` и не раздаются как public static
- Таблицы `car_categories`, `car_cities`, `car_brands`, `car_colors`, `car_body_types` используются как общие справочники для сайта, ЛК и админки
- Таблица `user_favorites` хранит избранные автомобили пользователей
- Для каждого автомобиля сохраняется `public_slug`, который генерируется из названия и автоматически дедуплицируется через `-2`, `-3` и дальше по необходимости
- Для тарифов автомобиля поддерживаются цены на `сутки`, `2-7 дней`, `от 7 дней`, `от 30 суток`, `от 60 суток`
- Для каждого автомобиля можно сохранять `тип кузова` и `кол-во мест`

## Timeweb Cloud

- Для деплоя в Timeweb Cloud достаточно заменить `DATABASE_URL` на строку подключения от managed PostgreSQL
- Если кластер требует защищённое подключение, установи `DATABASE_SSL=true`
- Локальная схема и продовая используют один и тот же `src/db/schema.sql`

## Роли пользователей

- `guest` - гость после бронирования без регистрации. Хранится в базе, но вход в аккаунт для него запрещен.
- `user` - зарегистрированный пользователь.
- `manager` - сотрудник с доступом в админ-панель.
- `admin` - полный доступ к админ-панели.

Если регистрация выполняется на email существующего `guest`, API не создаёт нового пользователя, а активирует существующий аккаунт и переводит его в роль `user`.

## Статусы верификации

- `inactive` - дефолтный статус нового пользователя, аккаунт еще не верифицирован
- `pending` - документы отправлены на модерацию
- `verified` - верификация подтверждена
- `rejected` - верификация отклонена

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
