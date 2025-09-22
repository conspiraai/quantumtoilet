#!/usr/bin/env tsx
import 'dotenv/config';

const backend = process.env.VITE_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';
const flushId = process.argv[2];
const recipient = process.argv[3];

if (!flushId || !recipient) {
  console.error('Usage: tsx scripts/mint-cli.ts <flushId> <recipientPubkey>');
  process.exit(1);
}

const main = async () => {
  const response = await fetch(`${backend}/mint/${flushId}?recipient=${recipient}`);
  if (!response.ok) {
    console.error('Failed to build mint transaction', await response.text());
    process.exit(1);
  }
  const json = await response.json();
  console.log('Transaction base64:', json.transaction);
};

main();
