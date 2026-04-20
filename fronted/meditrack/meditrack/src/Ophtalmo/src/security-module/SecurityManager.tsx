import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { SecurityModuleProps, UserProfile } from './SecurityTypes';
import './Security.css';

type TwoFactorMethod = 'SMS' | 'EMAIL' | 'APP';

export const SecurityManager: React.FC<SecurityModuleProps> = ({ user, onSecurityUpdate }) => {

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<UserProfile>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    twoFactorEnabled: false,
    twoFactorMethod: undefined
  });

  const [step, setStep] = useState<'normal' | 'select' | 'protocol'>('normal');
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod | null>(null);

  const [otpSecret, setOtpSecret] = useState<string | null>(null);
  const [otpAuthUrl, setOtpAuthUrl] = useState<string | null>(null);

  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ============================
     SIMULATION BACKEND CALL
  ============================ */

  const request2FASetup = async (method: TwoFactorMethod) => {
    setLoading(true);
    setError(null);
    setSelectedMethod(method);

    try {
      if (method === 'APP') {
        const fakeSecret = 'JBSWY3DPEHPK3PXP';
        const fakeUrl = `otpauth://totp/MediTrackPro:${formData.email}?secret=${fakeSecret}&issuer=MediTrackPro`;

        setOtpSecret(fakeSecret);
        setOtpAuthUrl(fakeUrl);
      }

      // Pour SMS / EMAIL → on simule juste l’envoi
      setStep('protocol');

    } catch {
      setError('Erreur lors de la configuration 2FA.');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {

    if (verificationCode.length !== 6) {
      setError('Le code doit contenir 6 chiffres.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulation validation backend
      if (verificationCode === '123456') {

        const updated = {
          ...formData,
          twoFactorEnabled: true,
          twoFactorMethod: selectedMethod || undefined
        };

        setFormData(updated);
        onSecurityUpdate(updated);

        resetFlow();

      } else {
        throw new Error();
      }

    } catch {
      setError('Code invalide.');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = () => {
    const updated = {
      ...formData,
      twoFactorEnabled: false,
      twoFactorMethod: undefined
    };

    setFormData(updated);
    onSecurityUpdate(updated);
    resetFlow();
  };

  const resetFlow = () => {
    setStep('normal');
    setOtpSecret(null);
    setOtpAuthUrl(null);
    setVerificationCode('');
    setSelectedMethod(null);
  };

  /* ============================
     UI
  ============================ */

  return (
    <div className="security-module">

      {/* ================= PROFILE ================= */}
      <div className="security-card">
        <div className="security-header">
          <h3>👤 Paramètres du Profil</h3>
          <button className="btn-edit" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Annuler" : "Modifier"}
          </button>
        </div>

        {isEditing ? (
          <div className="edit-grid">
            <input type="text" placeholder="Nom" className="sec-input"
              value={formData.nom}
              onChange={e => setFormData(prev => ({ ...prev, nom: e.target.value }))} />

            <input type="text" placeholder="Prénom" className="sec-input"
              value={formData.prenom}
              onChange={e => setFormData(prev => ({ ...prev, prenom: e.target.value }))} />

            <input type="email" placeholder="Email" className="sec-input"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} />

            <input type="tel" placeholder="Téléphone" className="sec-input"
              value={formData.telephone}
              onChange={e => setFormData(prev => ({ ...prev, telephone: e.target.value }))} />

            <button className="btn-save"
              onClick={() => { onSecurityUpdate(formData); setIsEditing(false); }}>
              Enregistrer
            </button>
          </div>
        ) : (
          <div className="profile-display">
            <p><strong>Nom :</strong> {formData.nom || '-'}</p>
            <p><strong>Email :</strong> {formData.email || '-'}</p>
            <p><strong>Téléphone :</strong> {formData.telephone || '-'}</p>
          </div>
        )}
      </div>

      {/* ================= 2FA ================= */}
      <div className="security-card">
        <div className="security-header">
          <h3>🛡️ Double Authentification</h3>

          <label className="switch">
            <input
              type="checkbox"
              checked={formData.twoFactorEnabled}
              onChange={() =>
                formData.twoFactorEnabled ? disable2FA() : setStep('select')
              }
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* CHOIX METHODE */}
        {step === 'select' && (
          <div className="protocol-box">
            <button className="method-item" onClick={() => request2FASetup('APP')}>
              🔑 Application (TOTP)
            </button>

            <button className="method-item" onClick={() => request2FASetup('SMS')}>
              📱 Code par SMS
            </button>

            <button className="method-item" onClick={() => request2FASetup('EMAIL')}>
              📧 Code par Email
            </button>
          </div>
        )}

        {/* PHASE VERIFICATION */}
        {step === 'protocol' && (
          <div className="protocol-box">

            {selectedMethod === 'APP' && otpAuthUrl && (
              <>
                <div className="qr-frame">
                  <QRCodeCanvas value={otpAuthUrl} size={160} level="H" />
                </div>
                <p>Scannez le QR Code avec votre application d’authentification.</p>
              </>
            )}

            {selectedMethod === 'SMS' && (
              <p>Un code a été envoyé par SMS au {formData.telephone || 'numéro enregistré'}.</p>
            )}

            {selectedMethod === 'EMAIL' && (
              <p>Un code a été envoyé à l’adresse {formData.email || 'email enregistré'}.</p>
            )}

            <input
              type="text"
              placeholder="Code à 6 chiffres"
              className="sec-input"
              maxLength={6}
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
            />

            {error && <p className="error-text">{error}</p>}

            <button className="btn-save" onClick={verify2FA} disabled={loading}>
              {loading ? 'Vérification...' : 'Activer'}
            </button>
          </div>
        )}

        {formData.twoFactorEnabled && step === 'normal' && (
          <div className="active-shield">
            ✅ 2FA actif via {formData.twoFactorMethod}
          </div>
        )}
      </div>

      {/* ================= AIDE ================= */}
      <div className="security-card">
        <div className="security-header">
          <h3>ℹ️ Aide & Version</h3>
        </div>

        <div className="help-box">
          <p>
            <strong>Version :</strong> 1.1.0 (Frontend multi-méthodes)
          </p>

          <ul>
            <li>Application : Authenticator compatible TOTP</li>
            <li>SMS : Code temporaire envoyé par message</li>
            <li>Email : Code temporaire envoyé par mail</li>
          </ul>
        </div>
      </div>

    </div>
  );
};