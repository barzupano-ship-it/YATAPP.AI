import { api } from '../lib/api';

type RestaurantLocation = {
  latitude?: number;
  longitude?: number;
  address?: string;
  googleMapsUrl?: string;
};

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCoordsFromGoogleMapsUrl(url: string): { latitude: number; longitude: number } | null {
  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]destination=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng };
    }
  }
  return null;
}

export async function getRestaurantLocation(
  restaurantId: string
): Promise<RestaurantLocation | null> {
  if (!USE_API || !restaurantId) return null;

  const restaurant = await api.get<Record<string, unknown>>(`/restaurants/${restaurantId}`);
  const latitude = toOptionalNumber(restaurant.latitude);
  const longitude = toOptionalNumber(restaurant.longitude);
  const googleMapsUrl =
    typeof restaurant.google_maps_url === 'string'
      ? restaurant.google_maps_url
      : undefined;

  let finalLat = latitude;
  let finalLng = longitude;
  if ((finalLat == null || finalLng == null) && googleMapsUrl) {
    const parsed = parseCoordsFromGoogleMapsUrl(googleMapsUrl);
    if (parsed) {
      finalLat = parsed.latitude;
      finalLng = parsed.longitude;
    }
  }

  return {
    latitude: finalLat,
    longitude: finalLng,
    address: typeof restaurant.address === 'string' ? restaurant.address : undefined,
    googleMapsUrl,
  };
}
