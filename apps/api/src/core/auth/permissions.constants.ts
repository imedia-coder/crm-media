export const CRM_PERMISSIONS = {
  COMPANIES_READ: 'crm.companies.read',
  COMPANIES_WRITE: 'crm.companies.write',
  CONTACTS_READ: 'crm.contacts.read',
  CONTACTS_WRITE: 'crm.contacts.write',
  DEALS_READ: 'crm.deals.read',
  DEALS_WRITE: 'crm.deals.write',
  PIPELINE_MANAGE: 'crm.pipeline.manage',
} as const;

export const PROJECT_PERMISSIONS = {
  PROJECTS_READ: 'projects.projects.read',
  PROJECTS_WRITE: 'projects.projects.write',
  TASKS_READ: 'projects.tasks.read',
  TASKS_WRITE: 'projects.tasks.write',
} as const;

export const DOCUMENT_PERMISSIONS = {
  DOCUMENTS_READ: 'documents.documents.read',
  DOCUMENTS_WRITE: 'documents.documents.write',
} as const;

export const BILLING_PERMISSIONS = {
  QUOTES_READ: 'billing.quotes.read',
  QUOTES_WRITE: 'billing.quotes.write',
  INVOICES_READ: 'billing.invoices.read',
  INVOICES_WRITE: 'billing.invoices.write',
} as const;

export const PLANNING_PERMISSIONS = {
  APPOINTMENTS_READ: 'planning.appointments.read',
  APPOINTMENTS_WRITE: 'planning.appointments.write',
} as const;

export const DASHBOARD_PERMISSIONS = {
  VIEW: 'dashboard.view',
} as const;

export const USER_PERMISSIONS = {
  USERS_READ: 'admin.users.read',
  USERS_WRITE: 'admin.users.write',
} as const;

export const ADMIN_PERMISSIONS = {
  RETENTION_RUN: 'admin.retention.run',
} as const;

export const AI_PERMISSIONS = {
  ASSISTANT_USE: 'ai.assistant.use',
} as const;

export const AUTOMATION_PERMISSIONS = {
  RULES_READ: 'automation.rules.read',
  RULES_WRITE: 'automation.rules.write',
} as const;

export const WHATSAPP_PERMISSIONS = {
  CHANNELS_READ: 'whatsapp.channels.read',
  CHANNELS_WRITE: 'whatsapp.channels.write',
  CONVERSATIONS_READ: 'whatsapp.conversations.read',
  CONVERSATIONS_WRITE: 'whatsapp.conversations.write',
} as const;

export const SUBCONTRACTOR_PERMISSIONS = {
  SUBCONTRACTORS_READ: 'subcontractors.subcontractors.read',
  SUBCONTRACTORS_WRITE: 'subcontractors.subcontractors.write',
} as const;

export const SOCIAL_PERMISSIONS = {
  ACCOUNTS_READ: 'social.accounts.read',
  ACCOUNTS_CONNECT: 'social.accounts.connect',
  ACCOUNTS_DISCONNECT: 'social.accounts.disconnect',
} as const;

export const PUBLISHING_PERMISSIONS = {
  TARGETS_READ: 'publishing.targets.read',
  TARGETS_WRITE: 'publishing.targets.write',
  SCHEDULE: 'publishing.schedule',
  PUBLISH_NOW: 'publishing.publish_now',
} as const;

export const MARKETING_PERMISSIONS = {
  CONTENT_READ: 'marketing.content.read',
  CONTENT_WRITE: 'marketing.content.write',
  CONTENT_VALIDATE: 'marketing.content.validate',
  MEDIA_READ: 'marketing.media.read',
  MEDIA_WRITE: 'marketing.media.write',
  CAMPAIGNS_READ: 'marketing.campaigns.read',
  CAMPAIGNS_WRITE: 'marketing.campaigns.write',
} as const;
