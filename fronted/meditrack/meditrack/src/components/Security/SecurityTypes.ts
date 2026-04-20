export interface UserProfile {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'SMS' | 'EMAIL' | 'APP';
  
}

export interface PaymentFormData {
    type: string;
    amount: string; // ou number selon ton choix
    method: string;
    phoneNumber: string;
    description: string; // <-- AJOUTE CETTE LIGNE
}
export interface SecurityModuleProps {
  user: UserProfile;
  onSecurityUpdate: (updatedUser: UserProfile) => void;
}
