import { useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, LoaderCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { Player } from '../types';

export function ImageUpload({ photoUrl, onUploaded }: { photoUrl?: string; onUploaded: (player: Player) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('JPG, PNG, WebP or AVIF · max 5 MB');
  const [error, setError] = useState('');
  const upload = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be 5 MB or smaller.'); return; }
    if (!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)) { setError('Choose a JPG, PNG, WebP, or AVIF photo.'); return; }
    setBusy(true); setError(''); setMessage('Uploading securely to ImageKit…');
    try {
      const body = new FormData(); body.append('photo', file, file.name);
      const result = await api<{ photoUrl: string; player: Player }>('/uploads/player-photo', { method: 'POST', body });
      onUploaded(result.player);
      setMessage('Photo uploaded to ImageKit and saved to your player card.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed.');
      setMessage('Your current profile photo was not changed.');
    } finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  };
  return <div>
    <button type="button" className="file-drop w-full" onClick={()=>inputRef.current?.click()} disabled={busy}>
      {busy ? <LoaderCircle size={16} className="animate-spin"/> : error ? <ImagePlus size={16}/> : photoUrl ? <CheckCircle2 size={16}/> : <ImagePlus size={16}/>}
      {busy ? 'Uploading to ImageKit' : photoUrl ? 'Replace profile photo' : 'Upload profile photo'}
    </button>
    <input ref={inputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>void upload(e.target.files?.[0])} />
    <p className={`mt-2 text-[8px] ${error?'text-rose-300':'text-slate-500'}`}>{error || message}</p>
  </div>;
}
