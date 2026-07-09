import { UserRole } from './users.entity';

export type CreateUserInput = {
  firstName?: string;
  lastName?: string;
  email: string;
  hashedPassword?: string;
  role?: UserRole;
  googleId?: string;
  emailVerified?: boolean;
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

export type OauthUser = {
  provider: string;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  photo: string;
  accessToken: string;
  role: UserRole;
};
