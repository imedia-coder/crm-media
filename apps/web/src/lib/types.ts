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

export type ProjectStatus =
  "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "DONE" | "ARCHIVED";

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

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

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

export type QuoteStatus =
  "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED" | "EXPIRED";

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

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

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

export type CampaignStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

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

export type ContentType =
  "POST" | "STORY" | "REEL" | "VIDEO" | "ARTICLE" | "NEWSLETTER" | "OTHER";
export type ContentStatus =
  | "DRAFT"
  | "PENDING_VALIDATION"
  | "VALIDATED"
  | "REJECTED"
  | "SCHEDULED"
  | "PUBLISHED";

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
  | "TASK_ASSIGNED"
  | "QUOTE_ACCEPTED"
  | "INVOICE_PAID"
  | "CONTENT_VALIDATION_NEEDED"
  | "GENERIC";

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

export type UserStatus = "ACTIVE" | "INVITED" | "DISABLED";

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

export type AiMessageRole = "USER" | "ASSISTANT";

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

export type AutomationTrigger = "QUOTE_ACCEPTED" | "INVOICE_PAID" | "DEAL_WON";

export interface CreateProjectActionConfig {
  type: "CREATE_PROJECT";
  config: { nameTemplate: string };
}

export interface CreateTaskActionConfig {
  type: "CREATE_TASK";
  config: {
    titleTemplate: string;
    useCreatedProject: boolean;
    projectId?: string;
  };
}

export interface SendNotificationActionConfig {
  type: "SEND_NOTIFICATION";
  config: { titleTemplate: string };
}

export type AutomationAction =
  | CreateProjectActionConfig
  | CreateTaskActionConfig
  | SendNotificationActionConfig;

export interface AutomationRun {
  id: string;
  status: "SUCCESS" | "FAILED";
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

export type WhatsAppChannelStatus = "PENDING" | "CONNECTED" | "ERROR";

export interface WhatsAppChannel {
  id: string;
  name: string;
  provider: string;
  phoneNumber: string | null;
  status: WhatsAppChannelStatus;
  webhookUrl: string;
  createdAt: string;
}

export type WhatsAppMessageDirection = "INBOUND" | "OUTBOUND";
export type WhatsAppMessageStatus =
  "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export interface WhatsAppMessage {
  id: string;
  direction: WhatsAppMessageDirection;
  status: WhatsAppMessageStatus;
  body: string;
  createdAt: string;
}

export interface WhatsAppConversation {
  id: string;
  channelId: string;
  phoneNumber: string;
  displayName: string | null;
  contactId: string | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface WhatsAppConversationWithMessages extends WhatsAppConversation {
  messages: WhatsAppMessage[];
}

export interface Subcontractor {
  id: string;
  firstName: string;
  lastName: string;
  personalAddress: string | null;
  personalPostalCode: string | null;
  personalCity: string | null;
  personalPhone: string | null;
  personalEmail: string | null;
  idDocumentNumber: string | null;
  idDocumentValidUntil: string | null;

  companyName: string | null;
  legalForm: string | null;
  siret: string | null;
  vatNumber: string | null;
  companyAddress: string | null;
  companyPostalCode: string | null;
  companyCity: string | null;
  companyPhone: string | null;
  companyEmail: string | null;

  bankAccountHolder: string | null;
  bankName: string | null;
  iban: string | null;
  bic: string | null;

  insuranceCompany: string | null;
  insurancePolicyNumber: string | null;
  insuranceValidUntil: string | null;
  hasLiabilityInsurance: boolean | null;
  hasTenYearInsurance: boolean | null;

  serviceType: string | null;
  dailyRate: string | null;
  interventionZone: string | null;
  availableFrom: string | null;
  experienceNotes: string | null;

  signedAt: string | null;
  signedLocation: string | null;

  createdAt: string;
}

export type CreateSubcontractorInput = Omit<
  Subcontractor,
  "id" | "createdAt" | "dailyRate"
> & {
  dailyRate?: number;
};

// ---------- Réseaux sociaux & publication ----------

export type SocialNetwork = "INSTAGRAM" | "FACEBOOK" | "TIKTOK";
export type SocialAccountStatus = "PENDING" | "CONNECTED" | "ERROR";
export type SocialCapabilityKind =
  "AUTO_PUBLISH" | "DRAFT_ONLY" | "MANUAL" | "UNVERIFIED" | "EXPIRED";

export interface SocialAccountCapability {
  capability: SocialCapabilityKind;
  reason: string | null;
  checkedAt: string;
}

export interface SocialAccount {
  id: string;
  companyId: string;
  network: SocialNetwork;
  externalId: string | null;
  handle: string | null;
  scopes: string[];
  tokenExpiresAt: string | null;
  status: SocialAccountStatus;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
  capability: SocialAccountCapability | null;
}

export type PublicationTargetStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PUBLISHING"
  | "PUBLISHED"
  | "ACTION_REQUISE"
  | "FAILED"
  | "CANCELLED";
export type PublicationTargetMode = "AUTO" | "DRAFT" | "MANUAL";
export type PublicationAttemptOutcome = "OK" | "RETRY" | "FAILED";

export interface PublicationAttempt {
  id: string;
  attemptNumber: number;
  outcome: PublicationAttemptOutcome;
  errorCode: string | null;
  errorDetail: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface PublicationTarget {
  id: string;
  publicationId: string;
  accountId: string;
  network: SocialNetwork;
  caption: string | null;
  hashtags: string[];
  mediaIds: string[];
  status: PublicationTargetStatus;
  mode: PublicationTargetMode;
  scheduledAt: string | null;
  externalPostId: string | null;
  publishedAt: string | null;
  lastError: string | null;
  account?: { id: string; network: SocialNetwork; handle: string | null };
  attempts?: PublicationAttempt[];
}

export interface Publication {
  id: string;
  companyId: string;
  contentItemId: string | null;
  campaignId: string | null;
  title: string;
  status: ContentStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  company?: { id: string; name: string };
  campaign?: { id: string; name: string } | null;
  targets: PublicationTarget[];
}
