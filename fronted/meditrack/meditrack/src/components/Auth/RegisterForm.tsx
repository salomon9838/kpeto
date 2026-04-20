// components/Auth/RegisterForm.tsx
import React from 'react';

interface RegisterFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onToggleForm: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, onToggleForm }) => {
  return (
    <>
      <h2>🏥 MediTrack-Pro</h2>
      <h3 style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Inscription Patient</h3>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Nom</label>
          <input type="text" name="nom" placeholder="Votre nom" required />
        </div>
        <div className="form-group">
          <label>Prénom</label>
          <input type="text" name="prenom" placeholder="Votre prénom" required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" placeholder="votre.email@exemple.com" required />
        </div>
        <div className="form-group">
          <label>Nom d'utilisateur</label>
          <input type="text" name="username" placeholder="Choisissez un nom d'utilisateur" required />
        </div>
        <div className="form-group">
          <label>Numéro de téléphone</label>
          <input type="tel" name="telephone" placeholder="+228 XX XX XX XX" required />
        </div>
        <div className="form-group">
          <label>Mot de passe</label>
          <input type="password" name="password" placeholder="Choisissez un mot de passe" required />
        </div>
        <div className="form-group">
          <label>Confirmer le mot de passe</label>
          <input type="password" name="confirmPassword" placeholder="Confirmez votre mot de passe" required />
        </div>
        <div className="form-group">
          <label>Adresse</label>
          <input type="text" name="adresse" placeholder="Votre adresse complète" required />
        </div>
        <button type="submit" className="btn-primary">S'inscrire</button>
      </form>
      <div className="auth-toggle">
        Déjà un compte? <a onClick={onToggleForm}>Se connecter</a>
      </div>
    </>
  );
};

export default RegisterForm;
