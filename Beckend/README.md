# YATAPP Backend

REST API for:
- `restaurant-dashboard`
- `YATAPPAI`
- `DELIVERY`

## Stack
- Node.js
- Express
- Prisma
- SQLite
- JWT auth

## Setup
```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run dev
```

The API will run at `http://localhost:3002/api`.

## Environment
Create `.env` from `.env.example`:

```env
DATABASE_URL="file:./dev.db"
PORT=3002
JWT_SECRET="change-me-in-production"
CORS_ORIGIN="*"
```

## Demo Accounts
- Restaurant owner: `owner@yatapp.local` / `password123`
- Customer: `customer@yatapp.local` / `password123`
- Courier: `courier@yatapp.local` / `password123`

## Main Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Restaurants
- `GET /api/restaurants`
- `GET /api/restaurants/:id`
- `POST /api/restaurants`
- `PUT /api/restaurants/:id`
- `GET /api/restaurants/owner/me`

### Menu
- `GET /api/menu/restaurant/:restaurantId`
- `POST /api/menu/category`
- `PUT /api/menu/category/:categoryId`
- `DELETE /api/menu/category/:categoryId`
- `POST /api/menu/item`
- `PUT /api/menu/item/:itemId`
- `DELETE /api/menu/item/:itemId`

### Orders
- `POST /api/orders`
- `GET /api/orders/customer`
- `GET /api/orders/restaurant?restaurant_id=:id`
- `GET /api/orders/available`
- `GET /api/orders/:id`
- `POST /api/orders/:id/accept`
- `PUT /api/orders/:id/status`

## Status Flow
`pending -> accepted -> preparing -> ready -> picked_up -> delivering -> delivered`

## Notes
- Wire responses use mostly `snake_case` for compatibility with the current clients.
- Restaurant creation is linked to the authenticated restaurant owner.
- Courier assignment happens through `POST /api/orders/:id/accept`.
