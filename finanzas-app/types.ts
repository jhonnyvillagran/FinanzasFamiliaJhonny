
export interface User {
  id: string;
  email: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO string
  category: string;
  user_id?: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string; // ISO string con hora
  is_completed: boolean;
  user_id?: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id:string;
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
}
