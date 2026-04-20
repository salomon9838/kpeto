import type { Order, Medicine } from "../Types";



export const dashboardStats = {
  todayOrders: 24,
  pendingOrders: 5,
  todayRevenue: 1450.50,
  lowStockItems: 3,
  pendingPrescriptions: 8,
  activeChats: 2
};

export const salesData = [
  { date: "Lun", revenue: 2400 },
  { date: "Mar", revenue: 1398 },
  { date: "Mer", revenue: 9800 },
  { date: "Jeu", revenue: 3908 },
  { date: "Ven", revenue: 4800 },
  { date: "Sam", revenue: 3800 },
  { date: "Dim", revenue: 4300 },
];

export const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "CMD-2023-001",
    customerName: "Jean Dupont",
    customerPhone: "06 12 34 56 78",
    items: [{}, {}],
    totalAmount: 45.90,
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    orderNumber: "CMD-2023-002",
    customerName: "Marie Martin",
    customerPhone: "07 98 76 54 32",
    items: [{}],
    totalAmount: 12.50,
    status: "ready",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    orderNumber: "CMD-2023-003",
    customerName: "Pierre Durand",
    customerPhone: "06 00 00 00 00",
    items: [{}, {}, {}],
    totalAmount: 89.20,
    status: "delivered",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

export const mockMedicines: Medicine[] = [
  {
    id: "1",
    name: "Doliprane 1000mg",
    stockQuantity: 150,
    minStockLevel: 20,
    status: "in_stock"
  },
  {
    id: "2",
    name: "Amoxicilline 500mg",
    stockQuantity: 5,
    minStockLevel: 10,
    status: "low_stock"
  },
  {
    id: "3",
    name: "Spasfon",
    stockQuantity: 0,
    minStockLevel: 15,
    status: "out_of_stock"
  }
];