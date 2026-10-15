import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Flag, Gavel, Play, RotateCw, StopCircle } from 'lucide-react';
import { api, jsonBody } from '../lib/api';
import type { Auction, Player, Team } from '../types';

const idOf=(v:string|Player|null|undefined)=>typeof v==='string'?v:v?._id||'';
const nameOf=(v:string|Team|null|undefined)=>typeof v==='object'&&v?v.name:'—';
export function AdminAuctionDashboard({players,auction,onToast,onRefresh}:{players:Player[];auction:Auction|null;onToast:(message:string,error?:boolean)=>void;onRefresh:()=>Promise<void>}){
  const [playerId,setPlayerId]=useState('');const [busy,setBusy]=useState(false);
  const unsold=useMemo(()=>players.filter(p=>p.auctionStatus==='unsold'),[players]);
  useEffect(()=>{if(!unsold.some(p=>p._id===playerId))setPlayerId(unsold[0]?._id||'')},[unsold,playerId]);
  const active=['active','final-call'].includes(auction?.status||'');
  const act=async(path:string,body:unknown,message:string)=>{setBusy(true);try{await api(path,{method:'POST',body:jsonBody(body)});await onRefresh();onToast(message)}catch(error){onToast(error instanceof Error?error.message:'Auction action failed.',true)}finally{setBusy(false)}};
  return <section className="section-block" id="admin-auction">
    <div className="page-container"><div className="section-head"><div><span className="eyebrow">Admin control room</span><h2 className="section-title">Auction <span>controls</span></h2><p className="section-subtitle">Start a lot, call the room, and close the sale. Finalizing transfers the player and deducts the winning purse in MongoDB.</p></div><span className="section-kicker">ROLE · ADMIN</span></div>
      <div className="admin-panel glass">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h3>Control active lot</h3><p>Only authenticated admins can change auction state or assign players.</p></div><span className={`live-tag ${active?'':'opacity-60'}`}>{auction?.status||'idle'}</span></div>
        <div className="admin-controls">
          <select className="select" value={playerId} onChange={e=>setPlayerId(e.target.value)} disabled={active||!unsold.length}><option value="">{unsold.length?'Choose an unsold player…':'No unsold players available'}</option>{unsold.map(p=><option key={p._id} value={p._id}>{p.name} · {p.primaryPosition} · ${p.basePrice.toLocaleString()}</option>)}</select>
          <button className="btn btn-primary" disabled={busy||active||!playerId} onClick={()=>void act('/auction/start',{playerId},'Bidding is live.')}><Play size={13}/>{busy?'Working…':'Start bidding'}</button>
          <button className="btn btn-outline" disabled={busy||!active} onClick={()=>void act('/auction/final-call',{},'Final call announced — bids are still accepted until the lot ends.')}><Flag size={13}/>Final call</button>
        </div>
        <div className="admin-actions">
          <button className="btn btn-gold" disabled={busy||!active} onClick={()=>void act('/auction/end',{},'Lot ended. A winning player was transferred to the squad.')}><Gavel size={13}/>End bidding · transfer winner</button>
          <button className="btn btn-danger" disabled={busy||!active} onClick={()=>void act('/auction/unsold',{},'Lot closed and the player returned to the unsold pool.')}><StopCircle size={13}/>Mark unsold</button>
          <button className="btn btn-outline" disabled={busy} onClick={()=>void onRefresh()}><RotateCw size={13}/>Refresh state</button>
        </div>
        <div className="admin-status flex items-center gap-2"><AlertTriangle size={12} className="text-amber-300"/><span>{active?`Current lot: ${auction?.activePlayer&&typeof auction.activePlayer==='object'?auction.activePlayer.name:'player'} · ${auction?.bidHistory?.length||0} valid bid(s) · lead: ${nameOf(auction?.leadingTeam as Team|null)}`:'No open lot. Starting a lot marks the selected player active.'}</span></div>
        {auction?.status==='final-call'&&<div className="mt-3 rounded-lg border border-amber-200/20 bg-amber-200/5 p-3 text-[8px] font-bold text-amber-100">FINAL CALL is active. Bids remain open until you press End bidding.</div>}
      </div>
    </div>
  </section>;
}
