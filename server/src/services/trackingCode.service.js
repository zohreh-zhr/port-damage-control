import crypto from 'crypto';

export function createTrackingCode() {
  const timePart = Date.now().toString().slice(-6);
  const randomPart = crypto.randomInt(10, 100);
  return `PORT-${timePart}-${randomPart}`;
}
