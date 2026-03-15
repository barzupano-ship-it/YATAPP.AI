# Courier Delivery

A mobile app for delivery drivers in a food delivery platform. Built with Expo and React Native.

## Tech Stack

- **Expo** - Development platform
- **React Native** - Mobile framework
- **React Navigation** - Stack & Bottom Tabs
- **Context API** - Auth & Delivery state

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/       # App screens
├── navigation/    # React Navigation setup
├── services/      # API & mock data
├── context/       # Auth & Delivery context
└── constants/     # Theme & styling
```

## Screens

- **LoginScreen** - Driver sign in
- **RegisterScreen** - New driver registration
- **AvailableOrdersScreen** - Browse and accept orders
- **ActiveDeliveryScreen** - Current delivery details & actions
- **DeliveryMapScreen** - Map view (placeholder for maps integration)
- **EarningsScreen** - Today/week/month earnings
- **ProfileScreen** - Account & settings

## Getting Started

```bash
npm install
npm start
```

Then press `a` for Android, `i` for iOS, or `w` for web.

## Demo Login

Use any email and password to sign in (mock auth). Example: `driver@test.com` / `password123`
