export interface Document {
  id: number;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  content: string;
  uploadedAt: Date;
}

export interface Session {
  id: number;
  documentId: number;
  name: string;
  createdAt: Date;
  lastMessageAt: Date;
}

export interface Message {
  id: number;
  documentId: number; // This is actually the sessionId in our context
  role: string;
  content: string;
  timestamp: Date;
}
