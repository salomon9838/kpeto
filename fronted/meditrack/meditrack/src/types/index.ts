// types/index.ts

export interface User {
  nom: string;
  prenom: string;
  username: string;
  email: string;
  telephone: string;
  adresse: string;
  password: string;
  sexe?: string;
  dateNaissance?: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
}

export interface MedicalEntry {
  id: number;
  date: string;
  service: string;
  medecin: string;
  diagnostic?: string;
  traitement?: string;
  patient: string;
}

export interface Payment {
  id: number;
  date: string;
  type: string;
  montant: string;
  methode: string;
  statut: string;
  patient: string;
}

export interface FamilyMember {
  id: number;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: string;
  lien: string;
  telephone?: string;
  email?: string;
  medicalHistory?: MedicalEntry[];
  paymentHistory?: Payment[];
}

export interface CarnetFormData {
  date: string;
  service: string;
  medecin: string;
  diagnostic: string;
  traitement: string;
}

export interface PaymentFormData {
  type: string;
  amount: string;
  method: string;
  phone: string;
  secret: string;
  confirmSecret: string;
}

export interface PaymentFormData {
  type: 'consultation' | 'analyse';
  amount: string;
  method: 'moov' | 'yas';
  phoneNumber: string;
}

export interface MemberFormData {
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: string;
  lien: string;
  telephone: string;
  email: string;
}

export interface ProfileFormData {
  nom: string;
  prenom: string;
  username: string;
  email: string;
  telephone: string;
  adresse: string;
  sexe: string;
  dateNaissance: string;
  password: string;
  confirmPassword: string;
}

export interface TwoFactorMethods {
  password: boolean;
  pin: boolean;
  sms: boolean;
  fingerprint: boolean;
}

export interface Modals {
  carnet: boolean;
  paiement: boolean;
  addMember: boolean;
  editMember: boolean;
  profile: boolean;
  memberHistory: boolean;
  help: boolean;
  twoFactor: boolean;
}

export interface Payment {
  id: number;
  type: string;
  date: string;
  amount: string;
  method: string;
  telephone: string;
  status: string;
}

export type PaymentStep = 'selection' | 'form' | 'confirmation' | 'secret' | 'confirm';
export type MemberTab = 'medical' | 'payment';
export type SettingsTab = 'profile' | 'family' | 'security';
export type MainTab = 'carnet' | 'paiement' | 'parametres';
