import { Platform } from 'react-native';
import { DeliveryMapScreen as DeliveryMapScreenNative } from './DeliveryMapScreen.native';
import { DeliveryMapScreen as DeliveryMapScreenWeb } from './DeliveryMapScreen.web';

export const DeliveryMapScreen =
  Platform.OS === 'web' ? DeliveryMapScreenWeb : DeliveryMapScreenNative;
