export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";
export type PrescriptionStatus = "pending" | "verified" | "dispensed";
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

// Une commande client
export interface Order {
  id: string;
  orderNumber: string;           // Ex: "CMD-001"
  customerName: string;
  customerPhone: string;
  items: OrderItem[];             // Liste des médicaments commandés
  totalAmount: number;            // Prix total en €
  status: OrderStatus;
  createdAt: string;              // Date de création
  deliveryMethod: "pickup" | "delivery";
  deliveryAddress?: string;       // ? = optionnel
  prescriptionRequired: boolean;  // Ordonnance nécessaire ?
  notes?: string;
}

// Un article dans une commande
export interface OrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  dosage: string;                 // Ex: "500mg"
}

// Un médicament dans l'inventaire
export interface Medicine {
  id: string;
  name: string;                   // Ex: "Doliprane 1000mg"
  genericName: string;            // Ex: "Paracétamol"
  manufacturer: string;           // Ex: "Sanofi"
  dosage: string;
  form: string;                   // Ex: "Comprimé", "Sirop"
  stockQuantity: number;          // Quantité en stock
  minStockLevel: number;          // Seuil d'alerte
  price: number;
  expiryDate: string;             // Date de péremption
  batchNumber: string;            // Numéro de lot
  requiresPrescription: boolean;
  category: string;               // Ex: "Antibiotique"
  status: StockStatus;
}

// Une ordonnance
export interface Prescription {
  id: string;
  patientName: string;
  patientAge: number;
  doctorName: string;
  doctorLicense: string;          // Numéro d'ordre du médecin
  prescribedDate: string;
  medications: PrescribedMedication[];
  status: PrescriptionStatus;
  verifiedBy?: string;            // Qui l'a vérifiée
  verifiedAt?: string;
  dispensedAt?: string;           // Quand elle a été délivrée
  notes?: string;
  warnings?: string[];            // Alertes (allergies, etc.)
}

// Un médicament prescrit dans l'ordonnance
export interface PrescribedMedication {
  medicineName: string;
  dosage: string;
  frequency: string;              // Ex: "3x par jour"
  duration: string;               // Ex: "7 jours"
  quantity: number;
  instructions: string;           // Instructions spéciales
}

// Statistiques du dashboard
export interface DashboardStats {
  todayOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  lowStockItems: number;
  pendingPrescriptions: number;
  activeChats: number;
}

export interface SalesData {
  date: string;
  revenue: number; // ✅ correct
  orders: number;
}
