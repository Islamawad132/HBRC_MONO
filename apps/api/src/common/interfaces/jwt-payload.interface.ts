export interface JwtPayload {
  sub: string;
  email: string;
  roleId?: string;
  isAdmin?: boolean;
  type?: 'customer' | 'employee' | 'user';
}
