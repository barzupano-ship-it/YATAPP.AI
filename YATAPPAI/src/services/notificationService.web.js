/**
 * Web stub for notification service - push notifications are not supported on web.
 */
export async function registerForPushNotifications() {
  return null;
}

export async function registerPushTokenWithBackend() {
  // No-op on web
}
