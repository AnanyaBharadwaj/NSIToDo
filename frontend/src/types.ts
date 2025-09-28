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

export interface FileAttachment {
  id: number;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  name: string;
}

export interface TodoAssignee {
  userId: number;
  id: number;
}

export interface Todo {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  creatorId: number;
  assignees: TodoAssignee[];
  files: FileAttachment[];
}
