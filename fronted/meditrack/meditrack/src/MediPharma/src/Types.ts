// src/Types.ts

export type Medicine = {
  minStockLevel: any;
  stockQuantity: any;
  expiryDate: string | number | Date;
  batchNumber: ReactNode;
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: StockStatus;
};

export enum StockStatus {
  EN_STOCK = "En stock",
  FAIBLE = "Stock faible",
  RUPTURE = "Rupture",
}

// 🔹 Type pour les médicaments prescrits
export type PrescribedMedication = {
  id: string;
  patientName: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
};

// 🔹 Type pour une ordonnance
export type Prescription = {
  id: string;
  patientName: string;
  medications: PrescribedMedication[];
  status: PrescriptionStatus;
  createdAt: string;
};

export enum PrescriptionStatus {
  EN_ATTENTE = "En attente",
  VALIDE = "Validée",
  ANNULEE = "Annulée",
}
