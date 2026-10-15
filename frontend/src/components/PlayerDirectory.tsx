import { useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import type { Player } from '../types';
import { PlayerCard } from './PlayerCard';

type Group = 'all'|'forward'|'midfield'|'defender'|'goalkeeper';
const groupPositions: Record<Exclude<Group,'all'>, string[]> = { forward:['ST','LW','RW'], midfield:['CAM','CM','CDM'], defender:['LB','RB','CB'], goalkeeper:['GK'] };

export function PlayerDirectory({ players, onAuction }: { players: Player[]; onAuction: (player: Player) => void }) {
  const [group, setGroup] = useState<Group>('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('overall');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = players.filter((player) => {
      const groupMatch = group === 'all' || groupPositions[group as Exclude<Group,'all'>].includes(player.primaryPosition);
      const statusMatch = status === 'all' || player.auctionStatus === status;
      const searchMatch = !q || `${player.name} ${player.jerseyName} ${player.primaryPosition} ${player.playstyle}`.toLowerCase().includes(q);
      return groupMatch && statusMatch && searchMatch;
    });
    if (sort === 'price-high') rows.sort((a,b) => b.basePrice-a.basePrice);
    else if (sort === 'price-low') rows.sort((a,b) => a.basePrice-b.basePrice);
    else rows.sort((a,b) => b.overall-a.overall);
    return rows;
  }, [players, group, status, sort, query]);
  const groups: {key:Group; label:string}[] = [{key:'all',label:'All positions'},{key:'forward',label:'Forwards'},{key:'midfield',label:'Midfielders'},{key:'defender',label:'Defenders'},{key:'goalkeeper',label:'Goalkeepers'}];
  return <section className="section-block" id="scouting">
    <div className="page-container">
      <div className="section-head"><div><span className="eyebrow">02 · Find your next signing</span><h2 className="section-title">Scouting <span>pool</span></h2><p className="section-subtitle">Search the player board, filter by role and auction status, and follow the live market.</p></div><span className="section-kicker">{players.length} PLAYER PROFILES</span></div>
      <div className="glass surface mb-4">
        <div className="chips">{groups.map((item)=><button key={item.key} className={`chip ${group===item.key?'active':''}`} onClick={()=>setGroup(item.key)}>{item.label}</button>)}</div>
        <div className="toolbar">
          <div className="search-field"><Search size={14}/><input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search player or playstyle…" aria-label="Search players" /></div>
          <select className="select" value={status} onChange={e=>setStatus(e.target.value)} aria-label="Auction status"><option value="all">All statuses</option><option value="unsold">Available</option><option value="active">On the block</option><option value="sold">Sold</option></select>
          <select className="select" value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort players"><option value="overall">Sort · Overall</option><option value="price-high">Price · High to low</option><option value="price-low">Price · Low to high</option></select>
        </div>
        <div className="flex items-center justify-between text-[8px] text-slate-500"><span className="flex items-center gap-1"><Users size={12}/>{filtered.length} player{filtered.length===1?'':'s'} shown</span><span>Player cards sync from MongoDB</span></div>
      </div>
      {filtered.length ? <div className="player-grid">{filtered.map(player=><PlayerCard key={player._id} player={player} onAuction={onAuction}/>)}</div> : <div className="empty-box">No players match these filters. Try widening your search.</div>}
    </div>
  </section>;
}
