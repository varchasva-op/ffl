import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { CircleDollarSign, Gavel, Radio, Shield, Trophy, Wifi, WifiOff } from 'lucide-react';
import type { Auction, Player, Team, User } from '../types';
import type { Socket } from 'socket.io-client';
import { PlayerCard } from './PlayerCard';

const increments = [50000, 100000, 250000, 500000];
const money = (value:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value || 0);
const shortMoney = (value:number) => value >= 1_000_000 ? `$${(value/1_000_000).toFixed(value%1_000_000?1:0)}M` : `$${Math.round(value/1000)}K`;
const idOf = (value: string | { _id: string } | null | undefined) => typeof value === 'string' ? value : value?._id || '';

export function AuctionRoom({ auction, teams, user, socket, onNeedLogin }: { auction: Auction|null; teams: Team[]; user: User|null; socket: Socket|null; onNeedLogin: ()=>void }) {
  const player = auction && typeof auction.activePlayer === 'object' ? auction.activePlayer : null;
  const leaderId = idOf(auction?.leadingTeam as string|Team|null);
  const [teamId, setTeamId] = useState('');
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(()=>{const allowed=teams.filter(team=>user?.role==='admin'||!team.owner||idOf(team.owner as string|{_id:string})===user?.id);if(!allowed.some(team=>team._id===teamId))setTeamId(allowed[0]?._id||'')},[teams,teamId,user]);
  useEffect(()=>{if(!socket)return;const onConnect=()=>setConnected(true);const onDisconnect=()=>setConnected(false);const onError=(payload:{message?:string})=>{setMessage(payload.message||'Bid could not be accepted.');window.setTimeout(()=>setMessage(''),3500)};setConnected(socket.connected);socket.on('connect',onConnect);socket.on('disconnect',onDisconnect);socket.on('auction:error',onError);return()=>{socket.off('connect',onConnect);socket.off('disconnect',onDisconnect);socket.off('auction:error',onError)}},[socket]);
  const eligibleTeams = useMemo(()=>teams.filter(team=>user?.role==='admin'||!team.owner||idOf(team.owner as string|{_id:string})===user?.id),[teams,user]);
  const highestBid=auction?.currentBid||auction?.startingPrice||0;
  const leadingTeam=typeof auction?.leadingTeam==='object'&&auction.leadingTeam?auction.leadingTeam:teams.find(t=>t._id===leaderId);
  const submitBid=(increment:number)=>{
    if(!user){onNeedLogin();return}
    if(!socket||!socket.connected){setMessage('The live room is reconnecting. Try again in a moment.');return}
    socket.emit('auction:bid',{teamId,increment},(result:{ok:boolean;message?:string})=>{if(!result?.ok)setMessage(result?.message||'Bid rejected.');else setMessage('Bid accepted · highest paddle updated live.');window.setTimeout(()=>setMessage(''),2800)});
  };
  return <section className="section-block" id="auction-room">
    <div className="page-container">
      <div className="section-head"><div><span className="eyebrow">03 · The room is open</span><h2 className="section-title">Live <span>auction</span> room</h2><p className="section-subtitle">Socket.IO keeps the board in sync across the auctioneer, players, and public viewers.</p></div><span className="live-tag"><span className={`dot ${connected?'':'red'}`}></span>{connected?'Live socket':'Reconnecting'}</span></div>
      <div className="auction-grid">
        <div className="auction-board glass">
          <div className="auction-head"><div><small>FRIDAY NIGHT · FFL LIVE</small><h3>{auction?.status==='final-call'?'Final call':auction?.status==='active'?'Player on the block':'Waiting for next lot'}</h3></div><span className="live-tag"><Radio size={12}/>{auction?.status?.replace('-',' ')||'idle'}</span></div>
          {auction && player ? <div className="auction-player">
            <div className="auction-player-card"><PlayerCard player={player}/></div>
            <div className="auction-detail"><span className="eyebrow">{player.primaryPosition}{player.secondaryPosition?` / ${player.secondaryPosition}`:''} · {player.playstyle}</span><h2>{player.name}</h2><p>Jersey #{player.jerseyNumber} · Age {player.age} · {player.preferredFoot} foot</p>
              <div className="auction-values"><div className="auction-value"><small>Starting base</small><strong>{shortMoney(auction.startingPrice||player.basePrice)}</strong></div><div className="auction-value current"><small>Current highest</small><strong>{shortMoney(highestBid)}</strong></div></div>
              <div className="bid-leader"><small>Leading franchise</small><b>{leadingTeam?`${leadingTeam.name} · ${leadingTeam.code}`:'Opening price · no bids yet'}</b></div>
              <div className="bid-history">{[...(auction.bidHistory||[])].slice(-5).reverse().map((bid,index)=>{const team=typeof bid.team==='object'?bid.team:teams.find(t=>t._id===bid.team);const bidder=typeof bid.bidder==='object'?bid.bidder:null;return <div className="bid-row" key={bid._id||index}><span>{team?.code||'TEAM'} · {bidder?.name||'Paddle raised'}</span><b>{money(bid.amount)}</b></div>})}</div>
            </div>
          </div> : <div className="auction-empty"><div><Gavel className="mx-auto mb-3 text-amber-300" size={30}/><strong>Waiting for the auctioneer</strong><p className="mt-2">The next player will appear here when an admin starts a lot.</p></div></div>}
        </div>
        <aside className="bid-panel glass">
          <div className="flex items-center justify-between"><h3>Raise the paddle</h3>{connected?<Wifi size={14} className="text-emerald-300"/>:<WifiOff size={14} className="text-rose-300"/>}</div>
          <p>{user ? (user.role==='admin'?'Admin test bidding is enabled.':'Choose your franchise and bid within its available purse.') : 'Sign in as a player to place bids; public visitors can watch live.'}</p>
          {user && <>
            <label className="form-label" htmlFor="bidTeam">Bid for franchise</label>
            <select id="bidTeam" className="select" value={teamId} onChange={e=>setTeamId(e.target.value)}><option value="">Choose a team…</option>{eligibleTeams.map(t=><option key={t._id} value={t._id}>{t.name} · {shortMoney(t.remainingPurse)}</option>)}</select>
          </>}
          {!eligibleTeams.length&&user?.role==='player'&&<div className="mt-3 rounded-lg border border-amber-200/15 bg-amber-100/5 p-3 text-[8px] text-amber-100">No team is assigned to your account yet. Ask the admin to assign you as a franchise owner.</div>}
          {teams.map(team=>{
            const activeTeam=team._id===teamId;const leading=leaderId===team._id;const remaining=team.remainingPurse||0;const rosterCount=team.roster?.length||0;
            return <div key={team._id} className={`bid-team ${activeTeam?'selected':''}`}>
              <div className="bid-team-head"><span className="crest" style={{'--team-color':team.crest?.primaryColor||'#00ff87','--team-secondary':team.crest?.secondaryColor||'#10231b'} as CSSProperties}>{team.crest?.icon||'⚽'}</span><div className="min-w-0 flex-1"><strong className="block truncate">{team.name}{leading?' · LEADING':''}</strong><small>{shortMoney(remaining)} purse · {rosterCount}/11 signed</small></div>{leading&&<Trophy size={14} className="text-emerald-300"/>}</div>
              <div className="bid-buttons">{increments.map(step=>{const label=step>=1000000?'+$0.5M':`+$${step/1000}K`;const disabled=!auction||!['active','final-call'].includes(auction.status)||!user||!connected||!activeTeam||highestBid+step>remaining||rosterCount>=11;return <button className="bid-button" key={step} disabled={disabled} onClick={()=>submitBid(step)}>{label}</button>})}</div>
            </div>;
          })}
          {!user&&<button className="btn btn-primary mt-3 w-full" onClick={onNeedLogin}><CircleDollarSign size={14}/>Sign in to bid</button>}
          {!!message&&<div className={`mt-3 text-[8px] ${message.toLowerCase().includes('reject')||message.toLowerCase().includes('exceed')?'text-rose-300':'text-emerald-200'}`}>{message}</div>}
          <p className="mt-3 text-center text-[7px] text-slate-500">Bid choices: +$50K · +$100K · +$250K · +$500K</p>
        </aside>
      </div>
    </div>
  </section>;
}
