import { useState, useEffect, useRef, useCallback } from 'react';
import { getWeather, WeatherResult } from '../api/weather';

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

interface UseWeatherReturn {
  weather: WeatherResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetch weather on mount (via geolocation), refresh every 30 min.
 * Falls back to a default city if geolocation is unavailable.
 */
export function useWeather(fallbackCity = 'Boston'): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result: WeatherResult;
      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }),
          );
          result = await getWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        } catch {
          // Geolocation denied or timed out — fall back to city
          result = await getWeather({ city: fallbackCity });
        }
      } else {
        result = await getWeather({ city: fallbackCity });
      }

      setWeather(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Weather unavailable');
    } finally {
      setLoading(false);
    }
  }, [fallbackCity]);

  useEffect(() => {
    fetchWeather();
    intervalRef.current = setInterval(fetchWeather, REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchWeather]);

  return { weather, loading, error, refresh: fetchWeather };
}
