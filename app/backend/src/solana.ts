export const getConnection = () => {
  const url = process.env.RPC_URL ?? 'https://api.mainnet-beta.solana.com';
  return new Connection(url, 'confirmed');
};

export const parsePublicKey = (key: string) => new PublicKey(key);
