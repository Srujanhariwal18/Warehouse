/**
 * Invora Warehouse Frontend — Backend & Database API Client
 * Connects frontend pages to Spring Boot REST endpoints on port 8080 (via Vite proxy /api).
 */

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return sessionStorage.getItem('invora_token') || localStorage.getItem('invora_token') || null;
}

export function setAuthToken(token: string) {
  sessionStorage.setItem('invora_token', token);
  localStorage.setItem('invora_token', token);
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      errorMsg = errJson.message || errJson.error || errorMsg;
    } catch {
      // not json
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// ── Service Endpoints ──────────────────────────────────────────

export interface HealthInfo {
  status: string;
  application: string;
  version: string;
  timestamp: string;
}

export interface BackendWarehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  capacity: number;
  createdAt: string;
}

export interface BackendZone {
  id: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface BackendRack {
  id: string;
  zoneId: string;
  zoneName: string;
  zoneCode: string;
  warehouseId: string;
  warehouseCode: string;
  name: string;
  code: string;
  capacity: number;
  createdAt: string;
}

export interface BackendInventory {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  rackId: string;
  rackCode: string;
  rackName: string;
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  quantity: number;
  updatedAt: string;
}

export interface BackendProduct {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  supplierId: string | null;
  supplierName: string | null;
  unit: string | null;
  unitPrice: number;
  threshold: number;
  reorderQuantity: number;
  description: string | null;
  active: boolean;
}

export interface BackendAlert {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  currentStock: number;
  threshold: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'WARNING' | 'OUT_OF_STOCK' | string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  message: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface BackendTransactionResponse {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  transactionType: 'IN' | 'OUT' | 'TRANSFER';
  quantity: number;
  sourceRackId: string | null;
  sourceRackCode: string | null;
  destinationRackId: string | null;
  destinationRackCode: string | null;
  reference: string | null;
  reason: string | null;
  balanceAfter: number | null;
  performedBySubject: string | null;
  performedByRole: string | null;
  createdAt: string;
}

export const invoraApi = {
  getHealth: () => request<HealthInfo>('/health'),

  // Warehouses, Zones, Racks
  getWarehouses: () => request<BackendWarehouse[]>('/warehouses'),
  getZones: (warehouseId?: string) => 
    warehouseId ? request<BackendZone[]>(`/warehouses/${warehouseId}/zones`) : request<BackendZone[]>('/zones'),
  getRacks: (zoneId?: string) =>
    zoneId ? request<BackendRack[]>(`/zones/${zoneId}/racks`) : request<BackendRack[]>('/racks'),

  // Inventory
  getAllInventory: () => request<BackendInventory[]>('/inventory'),
  getInventoryByRack: (rackId: string) => request<BackendInventory[]>(`/inventory/rack/${rackId}`),
  getInventoryByProduct: (productId: string) => request<BackendInventory[]>(`/inventory/product/${productId}`),

  // Products & Suppliers
  getProducts: () => request<BackendProduct[]>('/products'),

  // Alerts
  getAlerts: (status?: string, severity?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (severity) params.set('severity', severity);
    const qs = params.toString();
    return request<{ content: BackendAlert[]; totalElements: number } | BackendAlert[]>(`/alerts${qs ? `?${qs}` : ''}`);
  },
  acknowledgeAlert: (id: string) => request<BackendAlert>(`/alerts/${id}/acknowledge`, { method: 'PUT', body: '{}' }),
  resolveAlert: (id: string) => request<BackendAlert>(`/alerts/${id}/resolve`, { method: 'PUT', body: '{}' }),
  detectAlerts: () => request<{ detectedAlerts: number } | any>('/alerts/detect', { method: 'POST' }),

  // Transactions
  stockIn: (data: { productId: string; destinationRackId: string; quantity: number; reference?: string; reason?: string; batch?: string; supplierId?: string }) =>
    request<BackendTransactionResponse>('/stock/transactions/in', { method: 'POST', body: JSON.stringify(data) }),

  stockOut: (data: { productId: string; sourceRackId: string; quantity: number; destination?: string; reference?: string; reason?: string }) =>
    request<BackendTransactionResponse>('/stock/transactions/out', { method: 'POST', body: JSON.stringify(data) }),

  stockTransfer: (data: { productId: string; sourceRackId: string; destinationRackId: string; quantity: number; reference?: string; reason?: string }) =>
    request<BackendTransactionResponse>('/stock/transactions/transfer', { method: 'POST', body: JSON.stringify(data) }),

  // Dashboard
  getDashboardSummary: () => request<any>('/dashboard/summary'),
};
