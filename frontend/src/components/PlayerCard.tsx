import { ArrowUpRight, CircleDollarSign, ShieldCheck } from 'lucide-react';
import type { Player } from '../types';

const moneyShort = (value: number) => value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}M` : `$${Math.round(value / 1_000)}K`;
const letters = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || 'FF';
function fallbackPortrait(name: string) {
  const initials = letters(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 640"><defs><linearGradient id="a" x2="1" y2="1"><stop stop-color="#183d2a"/><stop offset="1" stop-color="#111924"/></linearGradient><radialGradient id="b"><stop stop-color="#00ff87" stop-opacity=".36"/><stop offset="1" stop-color="#00ff87" stop-opacity="0"/></radialGradient></defs><rect width="480" height="640" fill="url(#a)"/><circle cx="240" cy="190" r="260" fill="url(#b)"/><circle cx="240" cy="248" r="102" fill="#ba8b6b"/><path d="M142 243c-8-116 40-173 111-173 78 0 124 56 109 174-36-16-54-51-68-87-36 44-90 68-152 65Z" fill="#11191a"/><path d="M81 640c10-142 53-232 159-232s149 90 159 232" fill="#c4d0ca"/><text x="240" y="582" text-anchor="middle" fill="#00ff87" font-family="Arial" font-size="46" font-weight="800" letter-spacing="8">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function PlayerCard({ player, onAuction }: { player: Player; onAuction?: (player: Player) => void }) {
  const sold = player.auctionStatus === 'sold';
  const imageFallback = fallbackPortrait(player.name);
  const photo = player.photoUrl || imageFallback;
  const tier = player.basePrice >= 1_000_000 ? 'GOAT ICON' : player.overall >= 88 ? 'MARQUEE PRO' : 'FFL PLAYER';
  return (
    <article className="player-tile glass">
      <div className="fut-card">
        <div className="fut-inner">
          <img className="fut-photo" src={photo} alt={`${player.name} player portrait`} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = imageFallback; }} />
          <div className="fut-overlay" />
          <div className="fut-rating"><b>{player.overall}</b><small>OVR</small><span className="fut-position">{player.primaryPosition}</span></div>
          <span className="fut-price">{moneyShort(player.basePrice)}</span>
          <div className="fut-name">{player.jerseyName || player.name}</div>
          <div className="fut-meta">{tier} · #{player.jerseyNumber}</div>
          <div className="fut-stats">
            <span className="fut-stat"><b>PAC</b>{player.attributes?.pace ?? 40}</span><span className="fut-stat"><b>SHO</b>{player.attributes?.shooting ?? 40}</span><span className="fut-stat"><b>PAS</b>{player.attributes?.passing ?? 40}</span>
            <span className="fut-stat"><b>DRI</b>{player.attributes?.dribbling ?? 40}</span><span className="fut-stat"><b>DEF</b>{player.attributes?.defending ?? 40}</span><span className="fut-stat"><b>PHY</b>{player.attributes?.physical ?? 40}</span>
          </div>
        </div>
      </div>
      <div className="tile-footer">
        <div className="tile-status"><span className={`status-pill ${sold ? 'sold' : ''}`}>{sold ? 'Sold' : player.auctionStatus === 'active' ? 'On the block' : 'Available'}</span><span>{player.primaryPosition}{player.secondaryPosition ? ` / ${player.secondaryPosition}` : ''}</span></div>
        <div className="flex items-center justify-between gap-2 mt-2 text-[8px] text-slate-400"><span className="truncate">{player.playstyle}</span><span className="text-amber-300">{moneyShort(player.basePrice)}</span></div>
        {!sold && onAuction && <button className="btn btn-outline tile-action" onClick={() => onAuction(player)}><ArrowUpRight size={13} /> View in auction</button>}
        {sold && <div className="mt-2 flex items-center gap-1 text-[8px] text-amber-200"><ShieldCheck size={12} /> Signed for {moneyShort(player.soldPrice || player.basePrice)}</div>}
      </div>
    </article>
  );
}

export function PlayerCardCompact({ player }: { player: Player }) {
  const fallback = fallbackPortrait(player.name);
  const team = typeof player.team === 'object' && player.team ? player.team.name : '';
  return <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[.025] p-3">
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-amber-300/30 bg-slate-800"><img className="h-full w-full object-cover" src={player.photoUrl || fallback} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallback; }} /><span className="absolute bottom-0 right-0 rounded-tl bg-black/80 px-1 text-[8px] font-bold text-amber-200">{player.overall}</span></div>
    <div className="min-w-0 flex-1"><strong className="block truncate text-[10px]">{player.name}</strong><small className="text-[8px] text-slate-400">{player.primaryPosition} · {team || player.auctionStatus}</small></div>
    <span className="shrink-0 text-[9px] font-bold text-amber-200">{moneyShort(player.soldPrice || player.basePrice)}</span>
    <CircleDollarSign className="hidden text-slate-500 sm:block" size={14} />
  </div>;
}
