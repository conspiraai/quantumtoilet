import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import type { FlushRecord } from './types';
import { getConnection } from './solana';

export const buildMintTransaction = async (flush: FlushRecord, recipient: string) => {
  const connection = getConnection();
  const latestBlockhash = await connection.getLatestBlockhash();
  const recipientKey = new PublicKey(recipient);
  const payer = recipientKey;

  const memo = `Mint timeline ${flush.id}`;
  const instruction = SystemProgram.transfer({
    fromPubkey: recipientKey,
    toPubkey: recipientKey,
    lamports: 0
  });

  const tx = new Transaction({ feePayer: payer, blockhash: latestBlockhash.blockhash, lastValidBlockHeight: latestBlockhash.lastValidBlockHeight });
  tx.add(instruction);
  tx.add({
    keys: [],
    data: Buffer.from(memo),
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
  });
  return tx.serialize({ requireAllSignatures: false }).toString('base64');
};
