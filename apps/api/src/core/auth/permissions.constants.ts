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

export const MARKETING_PERMISSIONS = {
  CONTENT_READ: 'marketing.content.read',
  CONTENT_WRITE: 'marketing.content.write',
  CONTENT_VALIDATE: 'marketing.content.validate',
  MEDIA_READ: 'marketing.media.read',
  MEDIA_WRITE: 'marketing.media.write',
  CAMPAIGNS_READ: 'marketing.campaigns.read',
  CAMPAIGNS_WRITE: 'marketing.campaigns.write',
} as const;
