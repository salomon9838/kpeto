import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api/api';
import { FaHeart, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function CardioECG() {
  const location = useLocation(); const navigate = useNavigate();
  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [form, setForm] = useState({ rythme: '', frequence: '', axe: '', intervalles: '', conclusion: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { cId, pId } = location.state || {};
    if (pId) { setPatientId(pId); if (cId) setConsultationId(cId); }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !consultationId) return;
    setLoading(true);
    try {
      await apiFetch('examens-cardiologie/', {
        method: 'POST',
        body: JSON.stringify({
          consultation: consultationId, patient: patientId, service: 'cardiologie',
          type_examen: 'ecg', rythme_cardiaque: form.rythme, frequence_cardiaque: form.frequence ? parseInt(form.frequence) : null,
          axe_electrique: form.axe, intervalles: form.intervalles, conclusion_ecg: form.conclusion
        })
      });
      navigate('/payement', { state: { consultationId, patientId } });
    } catch (err) { console.error(err); alert('Erreur lors de l\'enregistrement'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '30px', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ background: '#c0392b', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
        <h2><FaHeart /> ❤️ ECG - Électrocardiogramme</h2>
      </header>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '12px' }}>
        <div style={{ marginBottom: '20px' }}><label>Rythme cardiaque</label><select value={form.rythme} onChange={e => setForm({...form, rythme: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: '5px' }}><option value="">Sélectionner</option><option value="sinusal">Sinusal</option><option value="fibrillation">Fibrillation auriculaire</option><option value="tachycardie">Tachycardie</option><option value="bradycardie">Bradycardie</option></select></div>
        <div style={{ marginBottom: '20px' }}><label>Fréquence (bpm)</label><input type="number" value={form.frequence} onChange={e => setForm({...form, frequence: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: '5px' }} /></div>
        <div style={{ marginBottom: '20px' }}><label>Axe électrique</label><input value={form.axe} onChange={e => setForm({...form, axe: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: '5px' }} /></div>
        <div style={{ marginBottom: '20px' }}><label>Intervalles (PR, QRS, QT)</label><textarea value={form.intervalles} onChange={e => setForm({...form, intervalles: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: '5px', minHeight: '80px' }} /></div>
        <div style={{ marginBottom: '25px' }}><label>Conclusion</label><textarea value={form.conclusion} onChange={e => setForm({...form, conclusion: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: '5px', minHeight: '100px' }} /></div>
        <button type="submit" disabled={loading} style={{ background: '#c0392b', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{loading ? 'Enregistrement...' : '💾 Enregistrer ECG'}</button>
      </form>
    </div>
  );
}