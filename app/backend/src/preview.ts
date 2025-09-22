import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Canvas } from 'skia-canvas';
import crypto from 'crypto';
import type { FlushRecord } from './types';

const assetBase = process.env.PUBLIC_ASSET_BASE ?? '';

const r2Configured =
  !!process.env.R2_ACCOUNT_ID && !!process.env.R2_ACCESS_KEY_ID && !!process.env.R2_SECRET_ACCESS_KEY && !!process.env.R2_BUCKET;

const getOutputPath = (id: string) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '../../public/flushes', `${id}.png`);
};

const getMetadataPath = (id: string) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '../../public/flushes', `${id}.json`);
};

const ensureDir = async (target: string) => {
  const dir = path.dirname(target);
  await mkdir(dir, { recursive: true });
};

const renderPreview = async (flush: FlushRecord) => {
  const canvas = new Canvas(1024, 1024);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#05010f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px "Space Grotesk"';
  ctx.textAlign = 'center';
  ctx.fillText('Quantum Toilet', canvas.width / 2, 100);

  ctx.fillStyle = '#8AFF6C';
  ctx.font = '32px "Space Grotesk"';
  ctx.fillText(`Rarity: ${flush.rarity}`, canvas.width / 2, 180);

  ctx.fillStyle = '#6CE7FF';
  ctx.font = '28px "Space Grotesk"';
  ctx.fillText(`Material: ${flush.traits.material}`, canvas.width / 2, 260);
  ctx.fillText(`Wormhole: ${flush.traits.wormhole}`, canvas.width / 2, 320);
  ctx.fillText(`Shape: ${flush.traits.shape}`, canvas.width / 2, 380);
  ctx.fillText(`FX: ${flush.traits.fx}`, canvas.width / 2, 440);
  ctx.fillText(`Accessories: ${flush.traits.accessories}`, canvas.width / 2, 500);

  ctx.strokeStyle = '#9D7CFF';
  ctx.lineWidth = 12;
  ctx.strokeRect(80, 80, canvas.width - 160, canvas.height - 160);

  ctx.fillStyle = '#ffffff';
  ctx.font = '24px "Space Grotesk"';
  ctx.fillText(`Buyer: ${flush.buyer.slice(0, 8)}...`, canvas.width / 2, 900);
  ctx.fillText(`Tx: ${flush.tx.slice(0, 10)}...`, canvas.width / 2, 950);

  return canvas.toBuffer('png');
};

const createMetadata = (flush: FlushRecord, imageUrl: string) => ({
  name: `Quantum Flush #${flush.id}`,
  symbol: 'FLUSH∞',
  description: 'Each flush splits the timeline — collect the outcome.',
  image: imageUrl,
  attributes: [
    { trait_type: 'Material', value: flush.traits.material },
    { trait_type: 'Wormhole', value: flush.traits.wormhole },
    { trait_type: 'Shape', value: flush.traits.shape },
    { trait_type: 'Accessories', value: flush.traits.accessories },
    { trait_type: 'FX', value: flush.traits.fx },
    { trait_type: 'Rarity', value: flush.rarity }
  ]
});

const hash = (input: Buffer) => crypto.createHash('sha256').update(input).digest('hex');

const sign = (key: string, msg: string) => crypto.createHmac('sha256', key).update(msg).digest();

const getSignatureKey = (secret: string, dateStamp: string, regionName: string, serviceName: string) => {
  const kDate = sign('AWS4' + secret, dateStamp);
  const kRegion = sign(kDate, regionName);
  const kService = sign(kRegion, serviceName);
  const kSigning = sign(kService, 'aws4_request');
  return kSigning;
};

const uploadToR2 = async (key: string, data: Buffer, contentType: string) => {
  if (!r2Configured) return null;
  const bucket = process.env.R2_BUCKET ?? '';
  const account = process.env.R2_ACCOUNT_ID ?? '';
  const accessKey = process.env.R2_ACCESS_KEY_ID ?? '';
  const secretKey = process.env.R2_SECRET_ACCESS_KEY ?? '';
  const host = `${account}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${bucket}/${key}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = hash(data);
  const canonicalUri = `/${bucket}/${key}`;
  const canonicalHeaders = `host:${host}\n` + `x-amz-content-sha256:${payloadHash}\n` + `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [`PUT`, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    hash(Buffer.from(canonicalRequest))
  ].join('\n');
  const signingKey = getSignatureKey(secretKey, dateStamp, 'auto', 's3');
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      Authorization: authorization
    },
    body: data
  });
  if (!res.ok) {
    throw new Error(`Failed to upload to R2: ${res.status}`);
  }
  return `${assetBase}${key}`;
};

export const ensurePreviewForFlush = async (flush: FlushRecord) => {
  const pngPath = getOutputPath(flush.id);
  await ensureDir(pngPath);
  const imageBuffer = await renderPreview(flush);
  await writeFile(pngPath, imageBuffer);
  const imageUrl = assetBase ? `${assetBase}flushes/${flush.id}.png` : `/flushes/${flush.id}.png`;

  const metadata = createMetadata(flush, imageUrl);
  const metadataPath = getMetadataPath(flush.id);
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  const metadataUrl = assetBase ? `${assetBase}flushes/${flush.id}.json` : `/flushes/${flush.id}.json`;

  if (r2Configured) {
    await uploadToR2(`flushes/${flush.id}.png`, imageBuffer, 'image/png');
    await uploadToR2(`flushes/${flush.id}.json`, Buffer.from(JSON.stringify(metadata)), 'application/json');
  }

  flush.image_url = imageUrl;
  flush.metadata_url = metadataUrl;
};
