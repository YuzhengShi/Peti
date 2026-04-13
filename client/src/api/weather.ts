import { apiFetch } from './fetch';

export interface WeatherResult {
  condition: string;
  description: string;
  temp: number;
  humidity: number;
  icon: string;
}

export function getWeather(params: { lat: number; lon: number } | { city: string }) {
  const qs = new URLSearchParams(
    'city' in params
      ? { city: params.city }
      : { lat: String(params.lat), lon: String(params.lon) },
  );
  return apiFetch<WeatherResult>(`/api/weather?${qs}`);
}
