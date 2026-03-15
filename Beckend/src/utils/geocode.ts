/**
 * Geocode an address to coordinates using OpenStreetMap Nominatim (free, no API key).
 * Usage policy: max 1 request/second, provide User-Agent, cache results.
 */

export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  if (!address || !address.trim()) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", address.trim());
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "YATAPP-Delivery/1.0 (food delivery backend)",
      },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = data?.[0];
    if (!first?.lat || !first?.lon) return null;

    const lat = parseFloat(first.lat);
    const lon = parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

    return { latitude: lat, longitude: lon };
  } catch {
    return null;
  }
}
