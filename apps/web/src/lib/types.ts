export interface Company {
  id: string;
  name: string;
  sizeRange: string | null;
  estimatedRevenue: string | null;
  isClient: boolean;
  clientSince: string | null;
  createdAt: string;
}

export interface Contact {
  id: string;
  companyId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
}

export interface Deal {
  id: string;
  title: string;
  companyId: string | null;
  contactId: string | null;
  stageId: string;
  estimatedValue: string | null;
  winProbability: number | null;
  company?: Company | null;
  stage?: PipelineStage;
}

export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'ARCHIVED';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  companyId: string | null;
  budget: string | null;
  managerId: string | null;
  company?: Company | null;
  _count?: { tasks: number };
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  estimatedHours: string | null;
  dueDate: string | null;
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  projectId: string | null;
  createdAt: string;
  versions: DocumentVersion[];
}

export interface LineItem {
  id?: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  vatRate: number | string;
}

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface Quote {
  id: string;
  number: string;
  status: QuoteStatus;
  currency: string;
  companyId: string;
  company?: Company;
  lines: LineItem[];
  totals?: { subtotal: number; vatTotal: number; total: number };
  createdAt: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Payment {
  id: string;
  amount: string;
  method: string;
  paidAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  currency: string;
  companyId: string;
  quoteId: string | null;
  company?: Company;
  lines: LineItem[];
  payments: Payment[];
  totals?: { subtotal: number; vatTotal: number; total: number };
  amountPaid?: number;
  amountDue?: number;
  createdAt: string;
}
