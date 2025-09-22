#!/usr/bin/env tsx
import 'dotenv/config';
import crypto from 'crypto';

const backend = process.env.VITE_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';
const buyer = process.argv[2] ?? 'SimulatedBuyer1111111111111111111111111111111';
const signature = crypto.randomBytes(32).toString('hex');

const main = async () => {
  const response = await fetch(`${backend}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signature, buyer })
  });
  if (!response.ok) {
    console.error('Failed to simulate flush', await response.text());
    process.exit(1);
  }
  console.log('Simulated flush', await response.json());
};

main();
