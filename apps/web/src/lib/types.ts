export interface Company {
  id: string;
  name: string;
  sizeRange: string | null;
  estimatedRevenue: string | null;
  isClient: boolean;
  clientSince: string | null;
  notes: string | null;
  anonymizedAt: string | null;
  createdAt: string;
}

export interface Contact {
  id: string;
  companyId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  marketingConsent: boolean;
  consentGivenAt: string | null;
  consentSource: string | null;
  anonymizedAt: string | null;
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
  dueDate: string | null;
  company?: Company | null;
  manager?: { id: string; firstName: string; lastName: string } | null;
  tasks?: { status: TaskStatus }[];
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
  project?: { id: string; name: string };
}

export interface Appointment {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  location: string | null;
  projectId: string | null;
  companyId: string | null;
  project?: { id: string; name: string } | null;
  company?: { id: string; name: string } | null;
}

export interface DashboardSummary {
  stats: {
    totalCompanies: number;
    totalClients: number;
    activeProjects: number;
    openDealsCount: number;
    openDealsValue: number;
    unpaidInvoicesTotal: number;
    overdueInvoicesCount: number;
  };
  upcomingAppointments: Appointment[];
  upcomingTaskDeadlines: Task[];
  upcomingProjectDeadlines: Project[];
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

export type CampaignStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Campaign {
  id: string;
  name: string;
  companyId: string | null;
  objective: string | null;
  status: CampaignStatus;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  company?: Company | null;
  _count?: { contentItems: number };
}

export type ContentType = 'POST' | 'STORY' | 'REEL' | 'VIDEO' | 'ARTICLE' | 'NEWSLETTER' | 'OTHER';
export type ContentStatus = 'DRAFT' | 'PENDING_VALIDATION' | 'VALIDATED' | 'REJECTED' | 'SCHEDULED' | 'PUBLISHED';

export interface ContentItem {
  id: string;
  title: string;
  body: string | null;
  type: ContentType;
  status: ContentStatus;
  hashtags: string[];
  scheduledAt: string | null;
  publishedAt: string | null;
  companyId: string | null;
  campaignId: string | null;
  company?: { id: string; name: string } | null;
  campaign?: { id: string; name: string } | null;
  author?: { id: string; firstName: string; lastName: string } | null;
  mediaAssets?: MediaAsset[];
}

export interface MediaAsset {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  tags: string[];
  campaignId: string | null;
  contentItemId: string | null;
  createdAt: string;
}

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'QUOTE_ACCEPTED'
  | 'INVOICE_PAID'
  | 'CONTENT_VALIDATION_NEEDED'
  | 'GENERIC';

export interface RevenueMonth {
  month: string;
  total: number;
}

export interface PipelineStageReport {
  stageId: string;
  name: string;
  isWon: boolean;
  isLost: boolean;
  dealCount: number;
  totalValue: number;
}

export interface ProjectProfitability {
  projectId: string;
  name: string;
  company: string | null;
  status: ProjectStatus;
  budget: number | null;
  hoursLogged: number;
  taskCompletion: number;
  invoicedTotal: number;
  paidTotal: number;
}

export type UserStatus = 'ACTIVE' | 'INVITED' | 'DISABLED';

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  mfaEnabledAt: string | null;
  anonymizedAt: string | null;
  role: { id: string; name: string } | null;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export type AiMessageRole = 'USER' | 'ASSISTANT';

export interface AiMessage {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiConversationWithMessages extends AiConversation {
  messages: AiMessage[];
}

export type AutomationTrigger = 'QUOTE_ACCEPTED' | 'INVOICE_PAID' | 'DEAL_WON';

export interface CreateProjectActionConfig {
  type: 'CREATE_PROJECT';
  config: { nameTemplate: string };
}

export interface CreateTaskActionConfig {
  type: 'CREATE_TASK';
  config: { titleTemplate: string; useCreatedProject: boolean; projectId?: string };
}

export interface SendNotificationActionConfig {
  type: 'SEND_NOTIFICATION';
  config: { titleTemplate: string };
}

export type AutomationAction = CreateProjectActionConfig | CreateTaskActionConfig | SendNotificationActionConfig;

export interface AutomationRun {
  id: string;
  status: 'SUCCESS' | 'FAILED';
  resultLog: string;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  isActive: boolean;
  actions: AutomationAction[];
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRuleWithRuns extends AutomationRule {
  runs: AutomationRun[];
}
