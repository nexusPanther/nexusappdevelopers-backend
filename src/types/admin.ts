export interface AdminResponse {
  _id: string;
  email: string;
  name?: string;
  avatar?: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}
