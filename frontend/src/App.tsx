import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarClock, CircleDollarSign, Menu, Shield, Trophy, Users, X } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { api } from './lib/api';
import { createFflSocket } from './lib/socket';
import type { Auction, Player, Team, Transaction } from './types';
import { AuthPanel } from './components/AuthPanel';
import { PlayerDirectory } from './components/PlayerDirectory';
import { TeamManager } from './components/TeamManager';
import { AuctionRoom } from './components/AuctionRoom';
import { AdminAuctionDashboard } from './components/AdminAuctionDashboard';
import { PlayerDashboard } from './components/PlayerDashboard';

const moneyShort=(value:number)=>value>=1_000_000?`$${(value/1_000_000).toFixed(value%1_000_000?1:0)}M`:`$${Math.round(value/1000)}K`;
function photoFallback(initials:string,color:string){const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 640"><defs><linearGradient id="a" x2="1" y2="1"><stop stop-color="#183d2a"/><stop offset="1" stop-color="#101823"/></linearGradient><radialGradient id="b"><stop stop-color="${color}" stop-opacity=".4"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><rect width="480" height="640" fill="url(#a)"/><circle cx="240" cy="190" r="260" fill="url(#b)"/><circle cx="240" cy="250" r="105" fill="#bc8f70"/><path d="M135 238c-10-112 45-169 116-169 79 0 121 58 110 172-37-20-57-52-69-89-39 43-91 65-157 64Z" fill="#131a1a"/><path d="M80 640c10-146 55-234 160-234s150 88 160 234" fill="#c5d1cb"/><text x="240" y="584" text-anchor="middle" fill="${color}" font-family="Arial" font-size="48" font-weight="800" letter-spacing="8">${initials}</text></svg>`;return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
function nextKickoff(){const now=new Date(),target=new Date(now);const days=(5-now.getDay()+7)%7;target.setDate(now.getDate()+days);target.setHours(19,0,0,0);if(target<=now)target.setDate(target.getDate()+7);return target}
function countdownText(target:Date,now:Date){let ms=Math.max(0,target.getTime()-now.getTime());const d=Math.floor(ms/86400000);ms%=86400000;const h=Math.floor(ms/3600000);ms%=3600000;const m=Math.floor(ms/60000);const s=Math.floor(ms/1000)%60;return `${String(d).padStart(2,'0')}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`}

export default function App(){
  const {user,token,ready,logout}=useAuth();
  const [players,setPlayers]=useState<Player[]>([]);const [teams,setTeams]=useState<Team[]>([]);const [auction,setAuction]=useState<Auction|null>(null);const [transactions,setTransactions]=useState<Transaction[]>([]);
  const [showAuth,setShowAuth]=useState(false);const [menuOpen,setMenuOpen]=useState(false);const [toast,setToast]=useState<{text:string;error?:boolean}|null>(null);const [apiError,setApiError]=useState('');const [socketConnected,setSocketConnected]=useState(false);const [countdown,setCountdown]=useState('00d 00h 00m 00s');
  const notify=useCallback((text:string,error=false)=>{setToast({text,error});window.setTimeout(()=>setToast(null),3500)},[]);
  const socket=useMemo(()=>createFflSocket(token),[token]);
  const refreshData=useCallback(async()=>{
    try{const [p,t,a]=await Promise.all([api<{players:Player[]}>('/players'),api<{teams:Team[]}>('/teams'),api<{auction:Auction;transactions?:Transaction[]}>('/auction/current')]);setPlayers(p.players);setTeams(t.teams);setAuction(a.auction);if(a.transactions)setTransactions(a.transactions);setApiError('')}
    catch(error){setApiError(error instanceof Error?error.message:'The API is unavailable.');throw error}
  },[]);
  useEffect(()=>{let alive=true;Promise.all([api<{players:Player[]}>('/players'),api<{teams:Team[]}>('/teams'),api<{auction:Auction;transactions?:Transaction[]}>('/auction/current')]).then(([p,t,a])=>{if(!alive)return;setPlayers(p.players);setTeams(t.teams);setAuction(a.auction);setTransactions(a.transactions||[]);setApiError('')}).catch(error=>{if(alive)setApiError(error instanceof Error?error.message:'The FFL API is unavailable.')});return()=>{alive=false}},[]);
  useEffect(()=>{if(!user)return;void refreshData().catch(()=>undefined)},[user,refreshData]);
  useEffect(()=>{
    const connect=()=>setSocketConnected(true);const disconnect=()=>setSocketConnected(false);
    const auctionUpdate=(next:Auction)=>setAuction(next);const teamUpdate=(next:Team[])=>setTeams(next);const playerUpdate=(next:Player[])=>setPlayers(next);const transactionUpdate=(next:Transaction[])=>setTransactions(next);
    socket.on('connect',connect);socket.on('disconnect',disconnect);socket.on('auction:state',auctionUpdate);socket.on('teams:state',teamUpdate);socket.on('players:state',playerUpdate);socket.on('transactions:state',transactionUpdate);setSocketConnected(socket.connected);
    return()=>{socket.off('connect',connect);socket.off('disconnect',disconnect);socket.off('auction:state',auctionUpdate);socket.off('teams:state',teamUpdate);socket.off('players:state',playerUpdate);socket.off('transactions:state',transactionUpdate);socket.disconnect()};
  },[socket]);
  useEffect(()=>{const target=nextKickoff();const update=()=>setCountdown(countdownText(target,new Date()));update();const timer=window.setInterval(()=>{const next=nextKickoff();setCountdown(countdownText(next,new Date()))},1000);return()=>window.clearInterval(timer)},[]);
  const pool=teams.reduce((sum,team)=>sum+(team.remainingPurse||0),0);
  const activeAuction=auction&&['active','final-call'].includes(auction.status);
  const onAuctionRequest=(player:Player)=>{document.getElementById('auction-room')?.scrollIntoView({behavior:'smooth'});notify(`${player.name} is available. An admin can place them on the block.`)};
  const navTo=(id:string)=>{setMenuOpen(false);document.getElementById(id)?.scrollIntoView({behavior:'smooth'})};
  const authAction=()=>user?logout():setShowAuth(true);
  return <div className="app-shell">
    <header className="topbar"><div className="page-container topbar-inner">
      <a href="#home" className="flex items-center gap-2.5"><span className="brand-mark"><Trophy size={21}/></span><span className="brand-name">FOOTBALL FRIDAY<small>LEAGUE · FFL</small></span></a>
      <nav className={`nav-main ${menuOpen?'open':''}`}><a href="#scouting" onClick={()=>setMenuOpen(false)}>Scouting</a><a href="#teams" onClick={()=>setMenuOpen(false)}>Franchises</a><a href="#auction-room" onClick={()=>setMenuOpen(false)}>Live auction</a>{user&&<a href={user.role==='admin'?'#admin-auction':'#player-dashboard'} onClick={()=>setMenuOpen(false)}>{user.role==='admin'?'Admin controls':'My player card'}</a>}</nav>
      <div className="nav-ctas"><span className="season-badge"><span className={`dot ${socketConnected?'':'gold'}`}/>{socketConnected?'SOCKET LIVE':'FFL · SEASON 01'}</span><button className="btn btn-primary btn-sm" onClick={authAction}>{user?`Sign out · ${user.name.split(' ')[0]}`:'Sign in / register'}</button><button className="icon-btn mobile-menu" onClick={()=>setMenuOpen(v=>!v)} aria-label="Toggle navigation">{menuOpen?<X size={17}/>:<Menu size={17}/>}</button></div>
    </div></header>

    <main>
      <section className="page-container hero-section" id="home">
        <div><span className="eyebrow"><Trophy size={14}/> Friday night · one pitch · no limits</span><h1 className="hero-title">Channel your<br/><span>inner GOAT</span><br/>this Friday.</h1><p className="hero-copy">Your community. Your club. Your moment. Build a squad, show up under the lights, and turn Friday football into a league worth talking about.</p><div className="hero-actions"><button className="btn btn-primary" onClick={()=>setShowAuth(true)}><Users size={13}/>Register as player</button><button className="btn btn-outline" onClick={()=>navTo('teams')}><Shield size={13}/>Explore franchises</button><button className="btn btn-gold" onClick={()=>navTo('auction-room')}><ArrowUpRight size={13}/>Enter live auction</button></div>
          <div className="countdown-panel"><div className="flex items-center gap-2.5"><CalendarClock className="text-cyan-200" size={19}/><div><div className="countdown-label">Next Friday Night Kickoff &amp; Auction</div><strong className="text-[10px]">Friday · 11:30 PM local time</strong></div></div><span className="countdown-time">{countdown}</span></div>
        </div>
        <div className="hero-rivalry" aria-label="Lionel Messi and Cristiano Ronaldo GOAT showcase"><div className="goat-side left"><img src="https://ik.imagekit.io/rcmycc2hq5/aniket.jpeg" alt="aniket" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=photoFallback('LM','#00e5ff')}}/><div className="goat-caption"><small>THE DEFENDER · RGIPT</small><strong>ANIKET JHA</strong><em>RGIPT · No. 18 · FFL GOAT ICON</em></div></div><div className="goat-side right"><img src="https://ik.imagekit.io/rcmycc2hq5/amanmancity.jpeg" alt="Aman Jha" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=photoFallback('CR','#ffd700')}}/><div className="goat-caption"><small>THE DEFENDER RGIPT</small><strong>AMAN JHA</strong><em>RGIPT · No. 27 · FFL GOAT ICON</em></div></div><span className="rivalry-label">The GOAT debate · Friday edition</span><span className="versus">VS</span></div>
      </section>
      <section className="page-container counter-row" aria-label="Live FFL counters"><div className="counter"><span className="counter-icon"><Users size={17}/></span><div><small>Registered players</small><strong>{String(players.length).padStart(2,'0')}</strong></div></div><div className="counter"><span className="counter-icon"><Shield size={17}/></span><div><small>Active franchises</small><strong>{String(teams.length).padStart(2,'0')}</strong></div></div><div className="counter"><span className="counter-icon"><CircleDollarSign size={17}/></span><div><small>Remaining auction pool</small><strong>{moneyShort(pool)}</strong></div></div></section>
      {apiError&&<div className="page-container"><div className="glass mb-3 rounded-xl border border-amber-200/15 p-3 text-[9px] text-amber-100"><strong>Backend connection needed:</strong> {apiError} Configure `VITE_API_URL` and start the backend to load MongoDB data.</div></div>}
      {user?.role==='admin'&&<AdminAuctionDashboard players={players} auction={auction} onToast={notify} onRefresh={refreshData}/>}
      {user?.role==='player'&&<PlayerDashboard auction={auction} players={players} onToast={notify}/>}
      <PlayerDirectory players={players} onAuction={onAuctionRequest}/>
      <TeamManager teams={teams} players={players} canManage={user?.role==='admin'} onTeamsChanged={setTeams} onToast={notify}/>
      <AuctionRoom auction={auction} teams={teams} user={user} socket={socket} onNeedLogin={()=>setShowAuth(true)}/>
      <section className="section-block" id="transactions"><div className="page-container"><div className="section-head"><div><span className="eyebrow">Signed under the lights</span><h2 className="section-title">Recent <span>transfers</span></h2><p className="section-subtitle">Every hammer is recorded with its winning team and final price.</p></div><span className="section-kicker">{transactions.length} SALES</span></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{transactions.slice(0,6).map((transaction,index)=>{const player=typeof transaction.player==='object'?transaction.player:null;const team=typeof transaction.team==='object'?transaction.team:null;return <div key={transaction._id||index} className="glass flex items-center justify-between gap-3 rounded-xl p-3"><div><strong className="block text-[10px]">{player?.name||'FFL signing'}</strong><small className="text-[8px] text-slate-400">{team?.name||'Franchise'} · HAMMER DOWN</small></div><span className="font-display text-sm text-emerald-300">{moneyShort(transaction.finalBid)}</span></div>})}{!transactions.length&&<div className="empty-box col-span-full">No completed signings yet — first hammer is yours.</div>}</div></div></section>
    </main>
    <footer className="footer"><div className="page-container footer-row"><div><div className="brand-name">FOOTBALL FRIDAY LEAGUE<small>BUILD YOUR CLUB · OWN YOUR FRIDAY</small></div><p className="mt-2">MongoDB-backed community football · ImageKit profile photography · Socket.IO live auction</p></div><div className="flex items-center gap-2"><span className={`dot ${socketConnected?'':'gold'}`}/><span>{socketConnected?'Realtime connected':'Waiting for backend'}</span><button className="btn btn-outline btn-sm ml-2" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}><ArrowDownRight size={12} className="rotate-180"/>Top</button></div></div></footer>
    {showAuth&&<AuthPanel onClose={()=>setShowAuth(false)} onToast={notify}/>}
    {toast&&<div className={`toast ${toast.error?'error':''}`} role="status">{toast.text}</div>}
    {!ready&&<div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/90 px-3 py-2 text-[8px] text-slate-400"><span className="dot"/>Restoring secure session</div>}
  </div>;
}
