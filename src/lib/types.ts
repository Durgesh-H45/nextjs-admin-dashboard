export type UserRole =
  | 'USER'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'SUB_ADMIN'
  | 'MANAGER'
  | 'CONTRIBUTOR';

export interface UserItem {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  blocked: boolean | null;
  role: UserRole | string;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  blocked?: boolean;
  role?: UserRole | string;
}

export interface AdminProfile {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  coldStart?: boolean;
  durationMs?: number;
}
