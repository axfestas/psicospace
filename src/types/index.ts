export type Role = "ESTUDANTE" | "DOCENTE" | "ADMIN" | "SUPERADMIN";
export type MaterialType = "PDF" | "SLIDE" | "LINK";
export type ProgressStatus = "NOT_VIEWED" | "IN_PROGRESS" | "COMPLETED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Period {
  id: string;
  name: string;
  order: number;
  disciplines?: Discipline[];
}

export interface Discipline {
  id: string;
  name: string;
  periodId: string;
  description?: string;
  materials?: Material[];
}

export interface Material {
  id: string;
  title: string;
  type: MaterialType;
  url: string;
  disciplineId: string;
  uploadedById: string;
  createdAt: string;
  progress?: { status: ProgressStatus }[];
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  userId: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
