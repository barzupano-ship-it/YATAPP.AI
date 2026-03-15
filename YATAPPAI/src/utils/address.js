export const formatAddressLine = (address) => {
  if (!address) return '';
  const parts = [
    address.street,
    address.city,
    address.postalCode,
  ].filter(Boolean);
  return parts.join(', ');
};
