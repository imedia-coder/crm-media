export interface JwtPayload {
  sub: string; // userId
  tenantId: string;
  roleId: string | null;
  permissions: string[];
  isClient: boolean;
  companyId: string | null;
}

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  roleId: string | null;
  permissions: string[];
  isClient: boolean;
  companyId: string | null;
}
