// src/security-module/SecurityTypes.ts

export interface UserProfile {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  twoFactorEnabled: boolean;
}

export interface SecurityModuleProps {
  user: UserProfile;
  // Cette fonction permettra aux autres de récupérer les modifs faites dans ton module
  onSecurityUpdate: (updatedUser: UserProfile) => void;
}

export interface UserProfile {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'SMS' | 'EMAIL' | 'APP'; // Nouvelle propriété
}