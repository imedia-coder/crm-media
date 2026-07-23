export interface JwtPayload {
  sub: string; // userId
  tenantId: string;
  roleId: string | null;
  permissions: string[];
  isClient: boolean;
}

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  roleId: string | null;
  permissions: string[];
  isClient: boolean;
}
