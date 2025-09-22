import { createHash } from 'crypto';
import { nanoid } from 'nanoid';
import type { FlushRecord, NewFlushInput, Rarity } from './types';

const MATERIALS = ['chrome', 'obsidian', 'iridescent', 'hologram', 'porcelain', 'glitch_metal'] as const;
const WORMHOLES = ['cosmic_violet', 'toxic_green', 'solar_flare', 'deep_space', 'pastel_nebula'] as const;
const SHAPES = ['elongated', 'chunky', 'lowpoly', 'bevelled', 'rubbery'] as const;
const ACCESSORIES = ['quantum_plunger', 'laser_lid', 'jetpack_tank', 'particle_leak', 'floating_receipts'] as const;
const FX = ['stardust', 'vortex_sparks', 'rim_glow', 'liquid_caustics'] as const;

export interface FlushTraits {
  material: (typeof MATERIALS)[number];
  wormhole: (typeof WORMHOLES)[number];
  shape: (typeof SHAPES)[number];
  accessories: (typeof ACCESSORIES)[number];
  fx: (typeof FX)[number];
}

export interface DerivedFlush extends FlushRecord {}

const pickFromHash = <T>(values: readonly T[], hash: Buffer, index: number): T => {
  const position = hash[index % hash.length];
  return values[position % values.length];
};

export const deriveTraits = (signature: string): { traits: FlushTraits; rarity: Rarity; seed: string } => {
  const hash = createHash('sha256').update(signature).digest();
  const traits: FlushTraits = {
    material: pickFromHash(MATERIALS, hash, 0),
    wormhole: pickFromHash(WORMHOLES, hash, 7),
    shape: pickFromHash(SHAPES, hash, 13),
    accessories: pickFromHash(ACCESSORIES, hash, 19),
    fx: pickFromHash(FX, hash, 23)
  };
  let rarity: Rarity = 'common';
  if (hash[31] === 0) {
    rarity = 'black_hole';
  } else if (hash[31] < 3) {
    rarity = 'mythic';
  }
  return {
    traits,
    rarity,
    seed: hash.toString('hex')
  };
};

export const createFlushFromSignature = (input: NewFlushInput): FlushRecord => {
  const { traits, rarity, seed } = deriveTraits(input.tx);
  return {
    id: nanoid(12),
    tx: input.tx,
    ts: input.ts,
    buyer: input.buyer,
    traits,
    rarity,
    seed,
    image_url: null,
    metadata_url: null
  };
};
