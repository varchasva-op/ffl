import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { Check, Edit3, Plus, Shield, Trash2, X } from 'lucide-react';
import { api, jsonBody } from '../lib/api';
import type { Player, Team, TeamForm } from '../types';

const blankCrest = { shape: 'shield' as const, icon: '⚽', primaryColor: '#00ff87', secondaryColor: '#10231b' };
const shortMoney = (value:number) => value >= 1_000_000 ? `$${(value/1_000_000).toFixed(value%1_000_000?1:0)}M` : `$${Math.round(value/1000)}K`;
const userId = (value: Team['owner']) => typeof value === 'string' ? value : value?._id || '';

export function TeamManager({ teams, players, canManage, onTeamsChanged, onToast }: {
  teams: Team[]; players: Player[]; canManage: boolean; onTeamsChanged: (teams: Team[])=>void; onToast: (message:string,error?:boolean)=>void;
}) {
  const [editingId,setEditingId]=useState('');
  const [busy,setBusy]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState('');
  const [form,setForm]=useState<TeamForm>({name:'',code:'',captainName:'',ownerId:'',crest:{...blankCrest}});
  useEffect(()=>{if(!confirmDelete)return;const timer=window.setTimeout(()=>setConfirmDelete(''),4500);return()=>window.clearTimeout(timer)},[confirmDelete]);
  const change=(key:keyof Omit<TeamForm,'crest'>,value:string)=>setForm(current=>({...current,[key]:value}));
  const changeCrest=(key:keyof TeamForm['crest'],value:string)=>setForm(current=>({...current,crest:{...current.crest,[key]:value} as TeamForm['crest']}));
  const resetForm=()=>{setForm({name:'',code:'',captainName:'',ownerId:'',crest:{...blankCrest}});setEditingId('')};
  const beginEdit=(team:Team)=>{setEditingId(team._id);setForm({name:team.name,code:team.code,captainName:team.captainName,ownerId:userId(team.owner),crest:{...team.crest}});window.scrollTo({top:document.getElementById('team-management')?.offsetTop||0,behavior:'smooth'})};
  const submit=async(event:FormEvent)=>{
    event.preventDefault();if(!form.name.trim()||!form.captainName.trim()||!/^[A-Z0-9]{3}$/.test(form.code.toUpperCase())){onToast('Add a team name, captain, and three-character code.',true);return}
    setBusy(true);
    try{
      const payload={...form,code:form.code.toUpperCase(),ownerId:form.ownerId||undefined};
      const response=editingId?await api<{team:Team}>(`/teams/${editingId}`,{method:'PATCH',body:jsonBody(payload)}):await api<{team:Team}>('/teams',{method:'POST',body:jsonBody(payload)});
      const updated=editingId?teams.map(t=>t._id===editingId?response.team:t):[response.team,...teams];
      onTeamsChanged(updated);onToast(editingId?'Franchise updated.':'New franchise registered with a $10M purse.');resetForm();
    }catch(error){onToast(error instanceof Error?error.message:'Could not save the team.',true)}finally{setBusy(false)}
  };
  const remove=async(team:Team)=>{
    if(confirmDelete!==team._id){setConfirmDelete(team._id);onToast(`Click “Confirm” to delete ${team.name}. Its signed players will return to the unsold pool.`);return}
    setBusy(true);
    try{await api(`/teams/${team._id}`,{method:'DELETE'});onTeamsChanged(teams.filter(t=>t._id!==team._id));if(editingId===team._id)resetForm();setConfirmDelete('');onToast(`${team.name} deleted; its players were released.`)}catch(error){onToast(error instanceof Error?error.message:'Could not delete this team.',true)}finally{setBusy(false)}
  };
  const ownerOptions=players.filter(p=>p.user&&typeof p.user==='object').map(p=>({id:(p.user as { _id:string })._id,name:p.name}));
  return <section className="section-block" id="teams">
    <div className="page-container">
      <div className="section-head"><div><span className="eyebrow">04 · Build your Friday dynasty</span><h2 className="section-title">Teams &amp; <span>franchises</span></h2><p className="section-subtitle">Track club purses and squads. Admins can create, edit, assign owners, or safely delete any franchise.</p></div><span className="section-kicker">{teams.length} REGISTERED CLUBS</span></div>
      <div className={canManage?'grid gap-4 xl:grid-cols-[.82fr_1.18fr]':'grid gap-4'}>
        {canManage&&<form className="glass surface" onSubmit={submit} id="team-management">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="font-display text-xl uppercase">{editingId?'Edit franchise':'Create a franchise'}</h3><p className="mt-1 text-[9px] text-slate-400">Every club starts with a protected virtual $10M purse.</p></div><span className="rounded-lg border border-emerald-300/20 bg-emerald-300/5 px-2 py-1 text-[7px] font-black tracking-widest text-emerald-300">ADMIN · CRUD</span></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="form-label">Team name</label><input className="input" value={form.name} onChange={e=>change('name',e.target.value)} maxLength={50} required placeholder="Friday Galacticos"/></div>
            <div><label className="form-label">3-letter code</label><input className="input uppercase" value={form.code} onChange={e=>change('code',e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3))} minLength={3} maxLength={3} required placeholder="FRG"/></div>
            <div className="col-span-2"><label className="form-label">Captain / owner name</label><input className="input" value={form.captainName} onChange={e=>change('captainName',e.target.value)} required placeholder="Captain's full name"/></div>
            <div className="col-span-2"><label className="form-label">Player account owner (optional)</label><select className="select" value={form.ownerId||''} onChange={e=>change('ownerId',e.target.value)}><option value="">Unassigned — any registered player can bid</option>{ownerOptions.map(owner=><option key={owner.id} value={owner.id}>{owner.name}</option>)}</select></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div><label className="form-label">Crest shape</label><select className="select" value={form.crest.shape} onChange={e=>changeCrest('shape',e.target.value)}><option value="shield">Heritage shield</option><option value="round">Roundel</option><option value="classic">Classic crest</option></select></div>
            <div><label className="form-label">Crest icon</label><select className="select" value={form.crest.icon} onChange={e=>changeCrest('icon',e.target.value)}><option>⚽</option><option>♛</option><option>⚡</option><option>★</option><option>🦅</option><option>🔥</option></select></div>
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-2"><input type="color" value={form.crest.primaryColor} onChange={e=>changeCrest('primaryColor',e.target.value)}/><span className="text-[8px] text-slate-400">Primary kit</span></label>
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-2"><input type="color" value={form.crest.secondaryColor} onChange={e=>changeCrest('secondaryColor',e.target.value)}/><span className="text-[8px] text-slate-400">Secondary kit</span></label>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <span className={`crest ${form.crest.shape}`} style={{'--team-color':form.crest.primaryColor,'--team-secondary':form.crest.secondaryColor} as CSSProperties}>{form.crest.icon}</span>
            <div><span className="text-[7px] font-black tracking-[.2em] text-emerald-300">LIVE CREST PREVIEW · {form.code||'FFL'}</span><strong className="mt-1 block font-display text-lg uppercase">{form.name||'Your franchise'}</strong><span className="text-[8px] text-slate-400">{form.captainName||'Captain / owner'} · $10M purse</span></div>
          </div>
          <div className="mt-4 flex gap-2"><button className="btn btn-primary flex-1" disabled={busy}>{busy?'Saving…':editingId?'Save franchise changes':'Register franchise'}</button>{editingId&&<button type="button" className="btn btn-outline" onClick={resetForm}><X size={13}/>Cancel</button>}</div>
        </form>}
        <div className="team-grid">
          {teams.length?teams.map(team=>{
            const roster=team.roster||[];const pct=Math.max(0,Math.min(100,(team.remainingPurse/(team.auctionPurse||10_000_000))*100));const owner=typeof team.owner==='object'&&team.owner?team.owner.name:'Owner unassigned';
            return <article key={team._id} className="team-tile glass" style={{'--team-color':team.crest?.primaryColor||'#00ff87','--team-secondary':team.crest?.secondaryColor||'#10231b'} as CSSProperties}>
              <div className="team-top"><span className={`crest ${team.crest?.shape||'shield'}`}>{team.crest?.icon||'⚽'}</span><div className="min-w-0"><h3 className="team-name truncate">{team.name}</h3><p className="team-owner">{team.code} · {team.captainName} · {owner}</p></div><span className="team-code">{team.code}</span></div>
              <div className="budget-line"><span>Remaining purse</span><b>{shortMoney(team.remainingPurse)}</b></div><div className="budget-track"><i style={{width:`${pct}%`}}/></div>
              <div className="team-foot"><span>{roster.length}/11 players signed</span>{canManage&&<div className="team-actions"><button className="btn btn-outline" onClick={()=>beginEdit(team)} title="Edit team"><Edit3 size={11}/> Edit</button><button className={`btn ${confirmDelete===team._id?'btn-gold':'btn-danger'}`} disabled={busy} onClick={()=>void remove(team)} title="Delete team">{confirmDelete===team._id?<><Check size={11}/> Confirm</>:<><Trash2 size={11}/> Delete</>}</button></div>}</div>
            </article>;
          }):<div className="empty-box col-span-full">No franchises yet{canManage?' — create the first club above.':'.'}</div>}
        </div>
      </div>
    </div>
  </section>;
}
