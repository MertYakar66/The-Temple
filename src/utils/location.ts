export function getGoogleMapsUrl(location: string, placeId?: string): string {
  const base = 'https://www.google.com/maps/search/?api=1';
  const params = new URLSearchParams({ query: location });
  if (placeId) params.set('query_place_id', placeId);
  return `${base}&${params.toString()}`;
}
