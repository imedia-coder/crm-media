export interface AutomationContext {
  companyId: string | null;
  companyName: string | null;
  /** User to notify for SEND_NOTIFICATION actions, when relevant. */
  ownerId: string | null;
  dealTitle?: string;
  quoteNumber?: string;
  invoiceNumber?: string;
}

export interface CreateProjectAction {
  type: 'CREATE_PROJECT';
  config: { nameTemplate: string };
}

export interface CreateTaskAction {
  type: 'CREATE_TASK';
  config: { titleTemplate: string; useCreatedProject: boolean; projectId?: string };
}

export interface SendNotificationAction {
  type: 'SEND_NOTIFICATION';
  config: { titleTemplate: string };
}

export type AutomationAction = CreateProjectAction | CreateTaskAction | SendNotificationAction;

const PLACEHOLDERS: Record<string, keyof AutomationContext> = {
  companyName: 'companyName',
  dealTitle: 'dealTitle',
  quoteNumber: 'quoteNumber',
  invoiceNumber: 'invoiceNumber',
};

/** Replaces {{companyName}}, {{dealTitle}}, {{quoteNumber}}, {{invoiceNumber}} with context values. */
export function renderTemplate(template: string, context: AutomationContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const field = PLACEHOLDERS[key];
    if (!field) return match;
    const value = context[field];
    return value ? String(value) : '';
  });
}
