import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaCheckCircle } from 'react-icons/fa';

export default function CardioEcho() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fevg: '', valveMitrale: '', valveAortique: '', pericarde: '', conclusion: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // API call here similar to CardioECG
    navigate('/payement');
  };

  return (
    <div style={{ padding: '30px', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ background: '#c0392b', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
        <h2><FaHeart /> ❤️ Échocardiographie</h2>
      </header>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '12px' }}>
        <div style={{ marginBottom: '20px' }}><label>FEVG (%)</label><input type="number" value={form.fevg} onChange={e => setForm({...form, fevg: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: '5px' }} placeholder="ex: 60" /></div>
        <div style={{ marginBottom: '20px' }}><label>Valve mitrale</label><textarea value={form.valveMitrale} onChange={e => setForm({...form, valveMitrale: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: '5px', minHeight: '80px' }} /></div>
        <div style={{ marginBottom: '20px' }}><label>Valve aortique</label><textarea value={form.valveAortique} onChange={e => setForm({...form, valveAortique: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: '5px', minHeight: '80px' }} /></div>
        <div style={{ marginBottom: '20px' }}><label>Péricarde</label><textarea value={form.pericarde} onChange={e => setForm({...form, pericarde: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: '5px', minHeight: '80px' }} /></div>
        <div style={{ marginBottom: '25px' }}><label>Conclusion</label><textarea value={form.conclusion} onChange={e => setForm({...form, conclusion: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: '5px', minHeight: '100px' }} /></div>
        <button type="submit" style={{ background: '#c0392b', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>💾 Enregistrer Écho</button>
      </form>
    </div>
  );
}