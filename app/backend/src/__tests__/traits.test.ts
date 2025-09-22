import { describe, it, expect } from 'vitest';
import { deriveTraits } from '../traits';

describe('deriveTraits', () => {
  it('is deterministic for a given signature', () => {
    const first = deriveTraits('abc123');
    const second = deriveTraits('abc123');
    expect(second).toEqual(first);
  });
});
