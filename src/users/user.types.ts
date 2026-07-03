import { UserRole } from './users.entity';

export type CreateUserInput = {
  firstName?: string;
  lastName?: string;
  email: string;
  hashedPassword: string;
  role?: UserRole;
};

export type UpdateUserInput = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  hashedPassword: string;
  emailVerified: boolean;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  phoneNumber: string;
  location: string;
}>;
