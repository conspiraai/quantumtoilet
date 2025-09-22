import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

export const getConnection = () => {
  const endpoint = import.meta.env.VITE_RPC_URL || clusterApiUrl('devnet');
  return new Connection(endpoint, 'confirmed');
};

export const shorten = (value: string, chars = 4) => `${value.slice(0, chars)}…${value.slice(-chars)}`;

export const buildMintUrl = (id: string, recipient: PublicKey) => `${__APP_CONFIG__.backendUrl}/mint/${id}?recipient=${recipient.toBase58()}`;
