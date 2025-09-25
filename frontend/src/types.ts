export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name?: string;
}