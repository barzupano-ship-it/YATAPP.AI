/**
 * Reverse geocode coordinates to address using OpenStreetMap Nominatim (free, works on web).
 * Fallback when expo-location reverseGeocodeAsync is unavailable (e.g. web SDK 49+).
 */
export async function reverseGeocodeNominatim(latitude, longitude) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'YATAPPAI/1.0 (food delivery app)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address;
    if (!addr) return null;
    return {
      street: [addr.house_number, addr.road].filter(Boolean).join(' ') || addr.road || addr.pedestrian || '',
      city: addr.city || addr.town || addr.village || addr.municipality || '',
      postalCode: addr.postcode || '',
    };
  } catch {
    return null;
  }
}
