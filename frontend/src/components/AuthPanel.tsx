import { useState, type FormEvent } from 'react';
import { Eye, LogIn, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const positions=['ST','LW','RW','CAM','CM','CDM','LB','RB','CB','GK'];
export function AuthPanel({ onClose, onToast }: { onClose:()=>void; onToast:(message:string,error?:boolean)=>void }) {
  const {login,register}=useAuth();
  const [mode,setMode]=useState<'login'|'register'>('login');
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setBusy(true);setError('');const data=new FormData(event.currentTarget);
    try{
      if(mode==='login')await login(String(data.get('email')),String(data.get('password')));
      else await register({name:String(data.get('name')),email:String(data.get('email')),password:String(data.get('password')),jerseyName:String(data.get('jerseyName')||data.get('name')),jerseyNumber:Number(data.get('jerseyNumber')||10),age:Number(data.get('age')||20),primaryPosition:String(data.get('primaryPosition')||'ST'),secondaryPosition:String(data.get('secondaryPosition')||''),preferredFoot:String(data.get('preferredFoot')||'Right'),playstyle:String(data.get('playstyle')||'Box-to-Box Engine'),basePrice:Number(data.get('basePrice')||100000),pace:Number(data.get('pace')||75),shooting:Number(data.get('shooting')||70),passing:Number(data.get('passing')||70),dribbling:Number(data.get('dribbling')||70),defending:Number(data.get('defending')||60),physical:Number(data.get('physical')||70)});
      onToast(mode==='login'?'Welcome back to FFL.':'Player account and card created.');onClose();
    }catch(err){const text=err instanceof Error?err.message:'Could not authenticate.';setError(text);onToast(text,true)}finally{setBusy(false)}
  };
  return <div className="auth-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className="auth-panel glass" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="mb-3 flex items-start justify-between gap-4"><div><span className="eyebrow">Football Friday League</span><h2 id="auth-title">{mode==='login'?'Sign into the room':'Register as player'}</h2><p>{mode==='login'?'Admin and player accounts use secure JWT sign-in.':'Create your FFL player login and scouting card.'}</p></div><button className="icon-btn" type="button" onClick={onClose} aria-label="Close sign-in"><X size={15}/></button></div>
      <div className="auth-toggle"><button className={`btn ${mode==='login'?'btn-primary':'btn-outline'}`} onClick={()=>{setMode('login');setError('')}} type="button"><LogIn size={13}/>Login</button><button className={`btn ${mode==='register'?'btn-primary':'btn-outline'}`} onClick={()=>{setMode('register');setError('')}} type="button"><UserPlus size={13}/>Player registration</button></div>
      <form className="auth-form" onSubmit={submit}>
        {mode==='register'&&<>
          <div><label className="form-label">Full name</label><input className="input" name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="Your name"/></div>
          <div className="grid grid-cols-2 gap-2"><div><label className="form-label">Jersey display name</label><input className="input" name="jerseyName" maxLength={20} placeholder="ALEX"/></div><div><label className="form-label">Jersey number</label><input className="input" type="number" name="jerseyNumber" min={1} max={99} defaultValue={10}/></div></div>
          <div className="grid grid-cols-2 gap-2"><div><label className="form-label">Age</label><input className="input" type="number" name="age" min={12} max={75} defaultValue={20}/></div><div><label className="form-label">Primary position</label><select className="select" name="primaryPosition">{positions.map(p=><option key={p}>{p}</option>)}</select></div></div>
          <div className="grid grid-cols-2 gap-2"><div><label className="form-label">Secondary position</label><select className="select" name="secondaryPosition"><option value="">None</option>{positions.map(p=><option key={p}>{p}</option>)}</select></div><div><label className="form-label">Preferred foot</label><select className="select" name="preferredFoot"><option>Right</option><option>Left</option><option>Both</option></select></div></div>
          <div className="grid grid-cols-2 gap-2"><div><label className="form-label">Playstyle</label><select className="select" name="playstyle"><option>Box-to-Box Engine</option><option>Messi Playmaker</option><option>Ronaldo Clinical Finisher</option><option>Brick Wall Defender</option><option>Sweeper Keeper</option></select></div><div><label className="form-label">Base price</label><select className="select" name="basePrice"><option value="100000">Tier C · $100K</option><option value="250000">Tier B · $250K</option><option value="500000">Tier A · $500K</option><option value="1000000">GOAT · $1M</option></select></div></div>
          <div><label className="form-label">Email address</label><input className="input" name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></div>
          <div><label className="form-label">Password · at least 8 characters</label><input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="Create a password"/></div>
        </>}
        {mode==='login'&&<>
          <div><label className="form-label">Email address</label><input className="input" name="email" type="email" autoComplete="username" required placeholder="you@example.com"/></div>
          <div><label className="form-label">Password</label><input className="input" name="password" type="password" autoComplete="current-password" required placeholder="Your password"/></div>
          <div className="flex items-center gap-2 rounded-lg border border-cyan-300/10 bg-cyan-300/[.03] p-3 text-[8px] text-slate-400"><ShieldCheck size={14} className="text-cyan-200"/>Admin access is provisioned from the backend environment; public admin registration is disabled.</div>
        </>}
        {error&&<div className="error-banner">{error}</div>}
        <button className="btn btn-primary mt-1 w-full" disabled={busy}>{busy?'Please wait…':mode==='login'?'Continue to FFL':'Create player account'}</button>
      </form>
    </section>
  </div>;
}
