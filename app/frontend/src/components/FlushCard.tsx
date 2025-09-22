import { useMemo } from 'react';
import type { Flush } from '../state/flushStore';
import { shorten } from '../lib/solana';

interface Props {
  flush: Flush;
}

const rarityTone: Record<Flush['rarity'], string> = {
  common: 'badge-common',
  mythic: 'badge-mythic',
  black_hole: 'badge-blackhole'
};

export const FlushCard = ({ flush }: Props) => {
  const rarityLabel = useMemo(() => flush.rarity.replace('_', ' ').toUpperCase(), [flush.rarity]);

  return (
    <article className="flush-card">
      <span className={`rarity ${rarityTone[flush.rarity]}`}>{rarityLabel}</span>
      <img src={flush.image_url ?? `/flushes/${flush.id}.png`} alt={`Flush ${flush.id}`} loading="lazy" />
      <div className="card-body">
        <h3>Tx {shorten(flush.tx)}</h3>
        <p>{shorten(flush.buyer)}</p>
        <dl>
          <div>
            <dt>Material</dt>
            <dd>{flush.traits.material}</dd>
          </div>
          <div>
            <dt>Wormhole</dt>
            <dd>{flush.traits.wormhole}</dd>
          </div>
          <div>
            <dt>Shape</dt>
            <dd>{flush.traits.shape}</dd>
          </div>
        </dl>
        <button
          className="mint-btn"
          onClick={() => {
            window.open(`${__APP_CONFIG__.backendUrl}/mint/${flush.id}`, '_blank');
          }}
        >
          Mint Timeline
        </button>
     </div>
    </article>
  );
};
