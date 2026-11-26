import { env } from './env.js';

export function getCorsOptions() {
  return {
    origin: env.CORS_ORIGIN,
    credentials: true
  };
}
