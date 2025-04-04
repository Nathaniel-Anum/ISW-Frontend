export interface User {
  id: string;
  staffId: string;
  name: string;
  email: string;
  department: { id: string; name: string };
  unit?: { id: string; name: string };
  roomNo?: string;
}

export interface Requisition {
  requisitionID: string;
  itemDescription: string;
  quantity: number;
  urgency?: string;
  purpose: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  declineReason?: string;
}