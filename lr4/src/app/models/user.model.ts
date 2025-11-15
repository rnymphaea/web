export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  status: 'active' | 'blocked' | 'unconfirmed';
  friends: number[];
  avatar?: string;
  birthDate?: string;
}
