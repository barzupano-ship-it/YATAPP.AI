export const formatCurrency = (value) =>
  new Intl.NumberFormat('tg-TJ', {
    style: 'currency',
    currency: 'TJS',
  }).format(value || 0);

/** Resolve image URL: use as-is if data URL or absolute URL, else prepend base */
export function resolveImageUrl(value, baseUrl) {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v) return null;
  if (/^(data:|https?:\/\/|blob:)/i.test(v)) return v;
  const base = (baseUrl || '').replace(/\/$/, '');
  return base ? `${base}${v.startsWith('/') ? v : `/${v}`}` : v;
}
