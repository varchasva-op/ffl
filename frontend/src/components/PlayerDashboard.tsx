import { useEffect, useState, type FormEvent } from 'react';
import { BadgeCheck, LoaderCircle, Save, Shield, Wallet } from 'lucide-react';
import { api, jsonBody } from '../lib/api';
import type { Auction, Player, Position } from '../types';
import { ImageUpload } from './ImageUpload';

const positions: Position[]=['ST','LW','RW','CAM','CM','CDM','LB','RB','CB','GK'];
const fields: {key:keyof NonNullable<Player['attributes']>;label:string}[]=[{key:'pace',label:'Pace'},{key:'shooting',label:'Shooting'},{key:'passing',label:'Passing'},{key:'dribbling',label:'Dribbling'},{key:'defending',label:'Defending'},{key:'physical',label:'Physical'}];
const money = (v:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v||0);
const activePlayerId=(auction:Auction|null)=>typeof auction?.activePlayer==='object'&&auction.activePlayer?auction.activePlayer._id:typeof auction?.activePlayer==='string'?auction.activePlayer:'';

export function PlayerDashboard({ auction, players, onToast }: { auction: Auction|null; players: Player[]; onToast:(message:string,error?:boolean)=>void }) {
  const [player,setPlayer]=useState<Player|null>(null);
  const [form,setForm]=useState({name:'',jerseyName:'',jerseyNumber:10,age:20,primaryPosition:'ST' as Position,secondaryPosition:'' as Position|'',preferredFoot:'Right' as 'Left'|'Right'|'Both',playstyle:'Box-to-Box Engine',basePrice:100000,attributes:{pace:75,shooting:70,passing:70,dribbling:70,defending:60,physical:70}});
  const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);
  useEffect(()=>{let alive=true;api<{player:Player}>('/players/me').then(({player:profile})=>{if(!alive)return;setPlayer(profile);setForm({name:profile.name,jerseyName:profile.jerseyName,jerseyNumber:profile.jerseyNumber,age:profile.age,primaryPosition:profile.primaryPosition,secondaryPosition:profile.secondaryPosition||'',preferredFoot:profile.preferredFoot,playstyle:profile.playstyle,basePrice:profile.basePrice,attributes:{...profile.attributes}})}).catch(error=>onToast(error instanceof Error?error.message:'Could not load player profile.',true)).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[onToast]);
  useEffect(()=>{if(!player)return;const updated=players.find(item=>item._id===player._id);if(updated)setPlayer(updated)},[players,player?._id]);
  const set=(key:string,value:string|number)=>setForm(current=>({...current,[key]:value}));
  const updateAttribute=(key:keyof typeof form.attributes,value:number)=>setForm(current=>({...current,attributes:{...current.attributes,[key]:value}}));
  const save=async(event:FormEvent)=>{event.preventDefault();setBusy(true);try{const result=await api<{player:Player}>('/players/me',{method:'PATCH',body:jsonBody(form)});setPlayer(result.player);onToast('Player profile updated.')}catch(error){onToast(error instanceof Error?error.message:'Could not save your profile.',true)}finally{setBusy(false)}};
  const onUploaded=(updated:Player)=>{setPlayer(updated);onToast('ImageKit photo saved to your player card.')};
  const active=player&&player.auctionStatus==='active'&&activePlayerId(auction)===player._id;
  const team=player&&typeof player.team==='object'&&player.team?player.team:null;
  if(loading)return <section className="section-block" id="player-dashboard"><div className="page-container"><div className="glass surface flex items-center gap-3 text-xs text-slate-400"><LoaderCircle size={16} className="animate-spin"/>Loading your player profile…</div></div></section>;
  if(!player)return <section className="section-block" id="player-dashboard"><div className="page-container"><div className="empty-box">Your player profile could not be found. Sign out and register again or contact the league admin.</div></div></section>;
  return <section className="section-block" id="player-dashboard">
    <div className="page-container"><div className="section-head"><div><span className="eyebrow">Your FFL account</span><h2 className="section-title">Player <span>dashboard</span></h2><p className="section-subtitle">Update your profile and keep your player card ready for Friday night.</p></div><span className="section-kicker">PRIVATE PLAYER VIEW</span></div>
      <div className="dashboard-grid">
        <div className="dashboard-card glass"><h3>Profile photo</h3><p>Images upload from the server to ImageKit; the resulting HTTPS URL is written to your MongoDB player document.</p>
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">{player.photoUrl?<img src={player.photoUrl} alt="Your player" className="h-16 w-16 rounded-xl object-cover"/>:<div className="grid h-16 w-16 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><Shield size={25}/></div>}<div><strong className="block text-sm">{player.jerseyName}</strong><span className="text-[8px] text-slate-400">{player.primaryPosition} · {player.overall} OVR</span></div></div>
          <ImageUpload photoUrl={player.photoUrl} onUploaded={onUploaded}/>
          <div className="status-card"><div className="flex items-center justify-between"><span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Auction status</span><BadgeCheck size={15} className={player.auctionStatus==='sold'?'text-amber-300':'text-emerald-300'}/></div><b className={player.auctionStatus==='sold'?'text-amber-200':active?'text-cyan-200':'text-emerald-200'}>{player.auctionStatus==='sold'?'SOLD · TEAM ASSIGNED':active?'LIVE ON THE BLOCK':'UNSOLD · AVAILABLE'}</b>
            {player.auctionStatus==='sold'?<p className="mt-1 text-[8px] text-slate-400">{team?.name||'Franchise'} · signed for {money(player.soldPrice||0)}</p>:active?<p className="mt-1 text-[8px] text-slate-400">Current bid {money(auction?.currentBid||player.basePrice)}</p>:<p className="mt-1 text-[8px] text-slate-400">Base price {money(player.basePrice)} · waiting for the auctioneer</p>}
          </div>
          {team&&<div className="mt-3 flex items-center gap-2 rounded-lg border border-cyan-300/15 bg-cyan-300/5 p-3 text-[9px] text-cyan-100"><Wallet size={14}/>{team.name} · {team.code}</div>}
        </div>
        <form className="dashboard-card glass" onSubmit={save}><h3>Player card details</h3><p>Changes update your profile record. Your official auction status is read-only.</p>
          <div className="profile-fields">
            <div className="wide"><label className="form-label">Full name</label><input className="input" value={form.name} onChange={e=>set('name',e.target.value)} required maxLength={80}/></div>
            <div><label className="form-label">Jersey display name</label><input className="input" value={form.jerseyName} onChange={e=>set('jerseyName',e.target.value)} required maxLength={20}/></div>
            <div><label className="form-label">Jersey number</label><input className="input" type="number" min={1} max={99} value={form.jerseyNumber} onChange={e=>set('jerseyNumber',Number(e.target.value))}/></div>
            <div><label className="form-label">Age</label><input className="input" type="number" min={12} max={75} value={form.age} onChange={e=>set('age',Number(e.target.value))}/></div>
            <div><label className="form-label">Primary position</label><select className="select" value={form.primaryPosition} onChange={e=>set('primaryPosition',e.target.value)}>{positions.map(pos=><option key={pos}>{pos}</option>)}</select></div>
            <div><label className="form-label">Secondary position</label><select className="select" value={form.secondaryPosition} onChange={e=>set('secondaryPosition',e.target.value)}><option value="">None</option>{positions.map(pos=><option key={pos}>{pos}</option>)}</select></div>
            <div><label className="form-label">Preferred foot</label><select className="select" value={form.preferredFoot} onChange={e=>set('preferredFoot',e.target.value)}><option>Right</option><option>Left</option><option>Both</option></select></div>
            <div><label className="form-label">Playstyle badge</label><select className="select" value={form.playstyle} onChange={e=>set('playstyle',e.target.value)}><option>Messi Playmaker</option><option>Ronaldo Clinical Finisher</option><option>Box-to-Box Engine</option><option>Brick Wall Defender</option><option>Sweeper Keeper</option></select></div>
            <div className="wide"><label className="form-label">Auction base price</label><select className="select" value={form.basePrice} onChange={e=>set('basePrice',Number(e.target.value))}><option value={100000}>Tier C · Rising Star · $100,000</option><option value={250000}>Tier B · Pro · $250,000</option><option value={500000}>Tier A · Marquee · $500,000</option><option value={1000000}>GOAT Icon Tier · $1,000,000</option></select></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">{fields.map(field=><label key={field.key} className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{field.label}<span className="float-right text-slate-200">{form.attributes[field.key]}</span><input className="mt-2 w-full accent-emerald-400" type="range" min={40} max={99} value={form.attributes[field.key]} onChange={e=>updateAttribute(field.key,Number(e.target.value))}/></label>)}</div>
          <button className="btn btn-primary mt-5" disabled={busy}><Save size={13}/>{busy?'Saving…':'Save player profile'}</button>
        </form>
      </div>
    </div>
  </section>;
}
