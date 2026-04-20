import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { SecurityModuleProps, UserProfile } from './SecurityTypes';
import './Security.css';

type TwoFactorMethod = 'SMS' | 'EMAIL' | 'APP';

export const SecurityManager: React.FC<SecurityModuleProps> = ({ user, onSecurityUpdate }) => {


  const [formData, setFormData] = useState<UserProfile>({
    nom: user.nom || '',
    prenom: user.prenom || '',
    email: user.email || '',
    telephone: user.telephone || '',
    twoFactorEnabled: user.twoFactorEnabled || false,
    twoFactorMethod: user.twoFactorMethod,
  });

  const [step, setStep] = useState<'normal' | 'select' | 'protocol'>('normal');
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod | null>(null);

  const [otpSecret, setOtpSecret] = useState<string | null>(null);
  const [otpAuthUrl, setOtpAuthUrl] = useState<string | null>(null);

  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request2FASetup = async (method: TwoFactorMethod) => {
    setLoading(true);
    setError(null);
    setSelectedMethod(method);
    try {
      if (method === 'APP') {
        // Générer une clé unique basée sur les données de l'utilisateur
        const uniqueSeed = `${user.email || 'user'}-${user.nom || ''}-${user.telephone || ''}-${Date.now()}`;
        const uniqueSecret = btoa(uniqueSeed)
          .replace(/[^A-Z2-7]/gi, '')
          .toUpperCase()
          .substring(0, 16)
          .padEnd(16, 'A');

        const userEmail = formData.email || user.email || 'user';
        const fakeUrl = `otpauth://totp/MediTrackPro:${userEmail}?secret=${uniqueSecret}&issuer=MediTrackPro`;

        setOtpSecret(uniqueSecret);
        setOtpAuthUrl(fakeUrl);
      }
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
      setError('Code invalide. (Utilisez 123456 pour la démonstration)');
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
    setError(null);
  };

  return (
    <div className="security-module">

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
            <p style={{ color: '#2c5f7c', fontWeight: 600, marginBottom: '10px', marginTop: 0 }}>
              Choisissez votre méthode :
            </p>
            <button className="method-item" onClick={() => request2FASetup('APP')}>
              🔑 Application (TOTP)
            </button>
            <button className="method-item" onClick={() => request2FASetup('SMS')}>
              📱 Code par SMS
            </button>
            <button className="method-item" onClick={() => request2FASetup('EMAIL')}>
              📧 Code par Email
            </button>
            <button onClick={resetFlow}
              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '13px', marginTop: '8px', padding: 0 }}>
              Annuler
            </button>
          </div>
        )}

        {/* PHASE VERIFICATION */}
        {step === 'protocol' && (
          <div className="protocol-box">

            {selectedMethod === 'APP' && otpAuthUrl && otpSecret && (
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                {/* Instructions claires */}
                <div style={{ background: '#e8f4f8', border: '1px solid #b8d4e0', borderRadius: '8px', padding: '12px', marginBottom: '15px', textAlign: 'left' }}>
                  <p style={{ color: '#2c5f7c', fontWeight: 700, fontSize: '13px', margin: '0 0 8px 0' }}>📱 Comment scanner ce QR code :</p>
                  <ol style={{ color: '#555', fontSize: '13px', margin: 0, paddingLeft: '18px', lineHeight: '1.8' }}>
                    <li>Installez <strong>Google Authenticator</strong> ou <strong>Authy</strong> sur votre téléphone</li>
                    <li>Ouvrez l'application → appuyez sur <strong>"+"</strong></li>
                    <li>Choisissez <strong>"Scanner un QR code"</strong></li>
                    <li>Pointez votre caméra sur le code ci-dessous</li>
                  </ol>
                </div>

                <div className="qr-frame" style={{ display: 'inline-block' }}>
                  <QRCodeCanvas value={otpAuthUrl} size={160} level="H" />
                </div>

                <p style={{ fontSize: '12px', color: '#888', margin: '10px 0 4px' }}>
                  ⚠️ Ne pas scanner avec l'appareil photo ou WhatsApp
                </p>
                <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>
                  Clé manuelle : <strong style={{ letterSpacing: 2, userSelect: 'all', cursor: 'text' }}>{otpSecret}</strong>
                </p>
              </div>
            )}

            {selectedMethod === 'SMS' && (
              <div style={{ background: '#e8f4f8', borderRadius: '6px', padding: '12px', marginBottom: '15px' }}>
                <p style={{ color: '#2c5f7c', margin: 0, fontSize: '14px' }}>
                  📱 Un code a été envoyé par SMS au <strong>{formData.telephone || 'numéro enregistré'}</strong>.
                </p>
              </div>
            )}

            {selectedMethod === 'EMAIL' && (
              <div style={{ background: '#e8f4f8', borderRadius: '6px', padding: '12px', marginBottom: '15px' }}>
                <p style={{ color: '#2c5f7c', margin: 0, fontSize: '14px' }}>
                  📧 Un code a été envoyé à l'adresse <strong>{formData.email || 'email enregistré'}</strong>.
                </p>
              </div>
            )}

            <input
              type="text"
              placeholder="Code à 6 chiffres"
              className="sec-input code-input"
              maxLength={6}
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '22px', fontWeight: 700 }}
            />

            {error && <p style={{ color: '#e74c3c', fontSize: '13px', marginBottom: '8px' }}>{error}</p>}

            <button className="btn-save" onClick={verify2FA} disabled={loading}>
              {loading ? '⏳ Vérification...' : '🔒 Activer'}
            </button>

            <button onClick={resetFlow}
              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '13px', marginTop: '8px', padding: 0, width: '100%', textAlign: 'center' }}>
              Annuler
            </button>
          </div>
        )}

        {formData.twoFactorEnabled && step === 'normal' && (
          <div className="active-shield">
            ✅ 2FA actif via {formData.twoFactorMethod}
          </div>
        )}

        {!formData.twoFactorEnabled && step === 'normal' && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '6px', padding: '12px', marginTop: '10px' }}>
            <p style={{ color: '#856404', fontSize: '14px', margin: 0 }}>
              ⚠️ La double authentification n'est pas activée.
            </p>
          </div>
        )}
      </div>

      {/* ================= AIDE ================= */}
      <div className="security-card">
        <div className="security-header">
          <h3>ℹ️ Aide & Version</h3>
        </div>
        <div className="help-box">
          <p><strong>Version :</strong> 1.1.0 (Frontend multi-méthodes)</p>
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
