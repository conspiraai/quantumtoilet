import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const secret = process.env.HELIUS_WEBHOOK_SECRET ?? '';

export const verifyWebhook = (req: Request, res: Response, next: NextFunction) => {
  if (!secret) {
    res.status(500).json({ error: 'webhook_secret_missing' });
    return;
  }

  const signatureHeader = req.header('x-helius-signature');
  if (!signatureHeader) {
    res.status(401).json({ error: 'signature_missing' });
    return;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const payload = JSON.stringify(req.body);
  const digest = hmac.update(payload).digest('hex');
  if (digest !== signatureHeader) {
    res.status(401).json({ error: 'signature_invalid' });
    return;
  }
  next();
};
