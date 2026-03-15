# Настройка Push-уведомлений в YATAPP

## Обзор

Push-уведомления требуют:
- **Физическое устройство** — не работают на эмуляторах
- **Development build** — на Android не работают в Expo Go (нужен `eas build`)
- **EAS Project** — для получения `projectId`

---

## Шаг 1: Установка пакетов

В каждом приложении (YATAPPAI и DELIVERY):

```bash
cd YATAPPAI   # или DELIVERY
npx expo install expo-notifications expo-device expo-constants
```

---

## Шаг 2: Настройка app.json

Добавьте плагин `expo-notifications` в `plugins`:

**YATAPPAI/app.json:**
```json
"plugins": [
  ["expo-image-picker", { ... }],
  "expo-asset",
  "expo-notifications"
]
```

**DELIVERY/app.json:**
```json
"plugins": [
  ["expo-location", { ... }],
  ["expo-splash-screen", { ... }],
  "expo-notifications"
]
```

---

## Шаг 3: EAS Project ID

1. Установите EAS CLI: `npm install -g eas-cli`
2. Войдите: `eas login`
3. Создайте проект: `eas init` (в папке YATAPPAI или DELIVERY)
4. Добавьте `extra.eas.projectId` в app.json:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "ваш-uuid-из-eas"
      }
    }
  }
}
```

Узнать projectId: `eas project:info`

---

## Шаг 4: Credentials для Android (FCM)

1. Создайте проект в [Firebase Console](https://console.firebase.google.com)
2. Добавьте Android-приложение (package name из app.json)
3. Скачайте `google-services.json` → положите в корень проекта
4. В [Expo](https://expo.dev) → Project → Credentials → Android → Add FCM V1 credentials
5. Загрузите JSON-ключ сервисного аккаунта Firebase

Подробнее: https://docs.expo.dev/push-notifications/fcm-credentials

---

## Шаг 5: Credentials для iOS

1. В [Expo](https://expo.dev) → Project → Credentials → iOS
2. Следуйте инструкциям для APNs (Apple Push Notification service)
3. Или: `eas credentials` → iOS → Push Notifications

---

## Шаг 6: Код в приложении

Создайте сервис уведомлений (пример для DELIVERY):

```typescript
// DELIVERY/src/services/notificationService.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });
  }

  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied');
    return null;
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) {
    console.warn('EAS projectId not found');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
}
```

Вызовите после логина и отправьте токен на бекенд.

---

## Шаг 7: Backend — сохранение токена

Поле `pushToken` уже добавлено в Prisma schema (User model).

Эндпоинт для сохранения:

```
PATCH /api/auth/me/push-token
Authorization: Bearer <token>
Body: { "push_token": "ExponentPushToken[xxx]" }
```

Push-уведомления отправляются автоматически при:
- Создании заказа → владельцу ресторана
- Принятии заказа курьером → владельцу ресторана, клиенту
- Смене статуса (принято, готовится, готово, забрано, доставляется, доставлено, отменено) → соответствующим участникам

---

## Шаг 8: Отправка уведомлений

С бекенда (Node.js):

```javascript
async function sendPushNotification(expoPushToken, title, body, data = {}) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
```

Или пакет: `expo-server-sdk` для batch-отправки.

---

## Шаг 9: Сборка приложения

```bash
eas build --profile development --platform android
# или
eas build --profile preview --platform ios
```

Установите собранное приложение на устройство и протестируйте.

---

## Тестирование

1. [Expo Push Tool](https://expo.dev/notifications) — вставьте ExpoPushToken и отправьте тестовое уведомление
2. Или отправьте с бекенда после сохранения токена

---

## Сценарии для YATAPP

| Событие | Кому | Сообщение |
|---------|------|-----------|
| Заказ принят рестораном | Клиент | "Ваш заказ принят и готовится" |
| Заказ готов к выдаче | Курьер | "Новый заказ готов к доставке" |
| Курьер назначен | Клиент | "Курьер в пути к вам" |
| Заказ доставлен | Клиент | "Заказ доставлен. Спасибо!" |

---

---

## Web Push (restaurant-dashboard, courier-company-dashboard)

Для веб-дашбордов используется **Web Push API** (отдельно от Expo Push). Требует:
- Service Worker
- VAPID keys
- Библиотека `web-push` на бекенде
- Отдельное поле/таблица для Web Push subscription (формат отличается от Expo)

Реализация Web Push для дашбордов — отдельная задача.

---

## Полезные ссылки

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [FCM Credentials](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [Expo Notifications Tool](https://expo.dev/notifications)
