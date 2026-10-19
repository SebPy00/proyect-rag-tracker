export interface Task {
  id: string;
  title: string;
  description: string | null;
  order: number;
  column: string;
}
export interface Column {
  id: string;
  title: string;
  order: number;
  tasks: Task[];
}
export interface Project {
  id: string;
  name: string;
  description: string | null;
  columns: Column[];
}
export interface Message {
  sender: "user" | "ai";
  text: string;
  created_at: string;
}
export interface Capabilities {
  ai_enabled: boolean;
  embeddings_enabled: boolean;
  rag_available: boolean;
}
