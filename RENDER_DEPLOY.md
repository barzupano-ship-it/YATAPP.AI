# Развёртывание YATAPP на Render

Пошаговая инструкция по подключению всего проекта к Render.

## Структура деплоя

| Сервис | Описание | URL после деплоя |
|--------|----------|------------------|
| **yatapp-backend** | API (Node.js + Express + Prisma) | `https://yatapp-backend.onrender.com` |
| **yatapp-restaurant-dashboard** | Панель ресторанов (Next.js) | `https://yatapp-restaurant-dashboard.onrender.com` |
| **yatapp-courier-panel** | Панель курьерской компании (Next.js) | `https://yatapp-courier-panel.onrender.com` |
| **yatapp-db** | PostgreSQL база данных | (внутренняя) |

> **YATAPPAI** (мобильное приложение Expo) не деплоится на Render — публикуется в App Store / Google Play или через Expo.

---

## Шаг 1: Репозиторий на GitHub

1. Создайте репозиторий на [GitHub](https://github.com/new).
2. Выполните в терминале:

```bash
cd d:\YATAPP
git init
git add .
git commit -m "Initial commit - YATAPP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YATAPP.git
git push -u origin main
```

---

## Шаг 2: Подключение к Render

1. Перейдите на [render.com](https://render.com) и войдите (через GitHub).
2. Нажмите **New** → **Blueprint**.
3. Подключите репозиторий YATAPP.
4. Render подхватит `render.yaml` и создаст все сервисы.

---

## Шаг 3: Переменные окружения

После первого деплоя задайте переменные вручную:

### yatapp-restaurant-dashboard и yatapp-courier-panel

В **Environment** каждого дашборда добавьте:

| Ключ | Значение |
|------|----------|
| `NEXT_PUBLIC_API_URL` | `https://yatapp-backend.onrender.com/api` |

(Подставьте реальный URL бэкенда из Render Dashboard.)

### yatapp-backend

Обычно задаётся через Blueprint. Если нужно, проверьте:

- `JWT_SECRET` — сгенерирован автоматически
- `DATABASE_URL` — берётся из PostgreSQL
- `CORS_ORIGIN` — `*` или список доменов фронтендов

---

## Шаг 4: Seed базы данных (опционально)

Для тестовых данных после деплоя:

1. В Render Dashboard откройте **yatapp-backend** → **Shell**.
2. Выполните:

```bash
npm run seed
```

---

## Локальная разработка с PostgreSQL

Backend переведён на PostgreSQL. Для локальной работы:

### Вариант A: Docker

```bash
docker run -d --name yatapp-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=yatapp -p 5432:5432 postgres:16
```

В `Beckend/.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yatapp"
```

### Вариант B: Облачная БД (Neon, Supabase)

Создайте бесплатную PostgreSQL и скопируйте connection string в `DATABASE_URL`.

### Миграции

```bash
cd Beckend
npx prisma migrate dev
npm run seed
```

---

## Важные замечания

1. **Бесплатный PostgreSQL** на Render действует 90 дней, затем нужно создать новый или перейти на платный план.
2. **Бесплатные Web Services** засыпают после ~15 минут неактивности; первый запрос может занимать 30–60 секунд.
3. **Файлы** (логотипы, фото) — лучше хранить в S3/Cloudflare R2, а не на диске Render.

---

## Проверка деплоя

1. Backend: `https://yatapp-backend.onrender.com/api/health` (если есть health endpoint).
2. Restaurant Dashboard: откройте URL и войдите.
3. Courier Panel: откройте URL и войдите.
