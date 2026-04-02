import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { config } from '../config';

const router = Router();

// GET /api/weather — proxy to OpenWeatherMap
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { lat, lon, city } = req.query;

  if (!config.openWeatherMapKey) {
    return res.status(503).json({
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Weather service not configured' },
    });
  }

  let url: string;
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${config.openWeatherMapKey}&units=metric`;
  } else if (city) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city as string)}&appid=${config.openWeatherMapKey}&units=metric`;
  } else {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Provide lat+lon or city' },
    });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({
        error: { code: 'UPSTREAM_ERROR', message: 'Weather API returned an error' },
      });
    }
    const raw: any = await response.json();
    return res.json({
      data: {
        condition: raw.weather?.[0]?.main ?? 'Unknown',
        description: raw.weather?.[0]?.description ?? '',
        temp: raw.main?.temp,
        humidity: raw.main?.humidity,
        icon: raw.weather?.[0]?.icon,
      },
    });
  } catch {
    return res.status(502).json({
      error: { code: 'UPSTREAM_ERROR', message: 'Failed to reach weather service' },
    });
  }
});

export default router;
