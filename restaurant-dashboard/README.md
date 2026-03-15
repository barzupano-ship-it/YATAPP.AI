# Restaurant Dashboard

A modern web application for restaurants to register and manage their restaurant and menu for a food delivery platform.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Lucide React** (icons)

## Project Structure

```
src/
├── app/              # Next.js App Router routes
├── components/       # Reusable UI components
│   ├── layout/       # Sidebar, Header, DashboardLayout
│   └── ui/           # Button, Input, Card
├── views/            # Page components (views)
├── services/         # API and business logic
│   ├── auth.service.ts
│   ├── restaurant.service.ts
│   ├── menu.service.ts
│   └── orders.service.ts
└── styles/          # Global styles
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Redirects to login |
| `/login` | Restaurant owner login |
| `/register` | Restaurant registration |
| `/dashboard` | Main dashboard with stats |
| `/dashboard/orders` | Order management |
| `/dashboard/menu` | Menu management |
| `/dashboard/settings` | Restaurant settings |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to the login page.

**Demo login:** Use any email and password to sign in (mock auth).

## Features

- **Register/Login** – Restaurant onboarding with split-screen layout
- **Dashboard** – Overview with stats, recent orders, pending actions
- **Orders** – View and update order status (pending → confirmed → preparing → ready → delivered)
- **Menu Management** – Browse menu by category, toggle item availability
- **Restaurant Settings** – Edit restaurant info, contact, location, delivery radius

Services use mock data. Replace with real API calls in `src/services/` when connecting to a backend.
