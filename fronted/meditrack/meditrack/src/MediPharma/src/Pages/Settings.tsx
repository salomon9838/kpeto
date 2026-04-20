import { useState } from "react";

// Types
interface UserProfile {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'SMS' | 'EMAIL' | 'APP';
}

const Settings = () => {
  // État initial (Données simulées)
  const [user, setUser] = useState<UserProfile>({
    nom: "Kodjo",
    prenom: "Pharmacien",
    email: "pharmacien.kodjo@medipharma.tg",
    telephone: "+228 90 12 34 56",
    twoFactorEnabled: false,
    twoFactorMethod: 'EMAIL',
  });

  const [isEditing, setIsEditing] = useState(false);

  // Styles réutilisables
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    padding: '30px',
    maxWidth: '900px',
    margin: '20px auto',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    marginTop: '8px',
    backgroundColor: isEditing ? '#fff' : '#f9f9f9',
    transition: 'all 0.3s ease'
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: '#00a896',
    fontSize: '18px',
    fontWeight: '600',
    borderLeft: '4px solid #00a896',
    paddingLeft: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '20px' }}>
      <div style={cardStyle}>
        
        {/* EN-TÊTE DU PROFIL */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#00a896', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>
              {user.nom[0]}{user.prenom[0]}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#2c3e50' }}>Paramètres du Compte</h1>
              <p style={{ margin: '5px 0 0', color: '#7f8c8d' }}>Gérez vos informations et votre sécurité</p>
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            style={{ padding: '10px 20px', backgroundColor: isEditing ? '#00a896' : '#fff', color: isEditing ? '#fff' : '#00a896', border: '1px solid #00a896', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: '0.3s' }}
          >
            {isEditing ? "💾 Enregistrer" : "⚙️ Modifier le profil"}
          </button>
        </div>

        {/* SECTION 1: INFORMATIONS PERSONNELLES (PARALLÈLE) */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={sectionTitleStyle}>👤 Informations Personnelles</h3>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ fontWeight: 'bold', color: '#555' }}>Nom</label>
              <input 
                style={inputStyle} 
                value={user.nom} 
                disabled={!isEditing} 
                onChange={(e) => setUser({...user, nom: e.target.value})}
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ fontWeight: 'bold', color: '#555' }}>Prénom(s)</label>
              <input 
                style={inputStyle} 
                value={user.prenom} 
                disabled={!isEditing}
                onChange={(e) => setUser({...user, prenom: e.target.value})}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ fontWeight: 'bold', color: '#555' }}>Email Professionnel</label>
              <input 
                style={inputStyle} 
                value={user.email} 
                disabled={!isEditing}
                onChange={(e) => setUser({...user, email: e.target.value})}
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ fontWeight: 'bold', color: '#555' }}>Téléphone</label>
              <input 
                style={inputStyle} 
                value={user.telephone} 
                disabled={!isEditing}
                onChange={(e) => setUser({...user, telephone: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: SÉCURITÉ & 2FA */}
        <div style={{ backgroundColor: '#fcfdfd', padding: '20px', borderRadius: '10px', border: '1px solid #eef2f1' }}>
          <h3 style={sectionTitleStyle}>🛡️ Sécurité & Authentification</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50' }}>Double Authentification (2FA)</p>
              <p style={{ margin: '5px 0 0', color: '#7f8c8d', fontSize: '13px' }}>Ajoutez une couche de sécurité supplémentaire à votre compte.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', color: user.twoFactorEnabled ? '#00a896' : '#e74c3c', fontWeight: 'bold' }}>
                {user.twoFactorEnabled ? "Activé" : "Désactivé"}
              </span>
              <button 
                onClick={() => setUser({...user, twoFactorEnabled: !user.twoFactorEnabled})}
                style={{
                  width: '50px',
                  height: '24px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: user.twoFactorEnabled ? '#00a896' : '#ccc',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: '0.3s'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: user.twoFactorEnabled ? '28px' : '2px',
                  transition: '0.3s'
                }} />
              </button>
            </div>
          </div>

          {user.twoFactorEnabled && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff', border: '1px solid #00a896', borderRadius: '8px', display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Méthode de réception</label>
                <select 
                  style={inputStyle} 
                  value={user.twoFactorMethod}
                  onChange={(e) => setUser({...user, twoFactorMethod: e.target.value as any})}
                >
                  <option value="EMAIL">📧 Email (Code par mail)</option>
                  <option value="SMS">📱 SMS (Code par téléphone)</option>
                  <option value="APP">🔐 Application (Google Authenticator)</option>
                </select>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', color: '#666', fontSize: '13px' }}>
                💡 Recommandé : Utilisez une application pour une sécurité maximale.
              </div>
            </div>
          )}
        </div>

        {/* PIED DE PAGE */}
        <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <p style={{ fontSize: '12px', color: '#bdc3c7' }}>
            Dernière connexion : Aujourd'hui à 15:22 (Lomé, Togo)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;