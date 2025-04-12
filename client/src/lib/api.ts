import { Document, Session, Message } from "./types";

// Get all documents
export async function getDocuments(): Promise<Document[]> {
  const response = await fetch('/api/documents', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.status}`);
  }
  
  return response.json();
}

// Get document by ID
export async function getDocument(id: number): Promise<Document> {
  const response = await fetch(`/api/documents/${id}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.status}`);
  }
  
  return response.json();
}

// Upload document
export async function uploadDocument(file: File): Promise<{ document: Document, session: Session }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Upload failed with status: ${response.status}`);
  }
  
  return response.json();
}

// Get sessions for a document
export async function getSessions(documentId: number): Promise<Session[]> {
  const response = await fetch(`/api/documents/${documentId}/sessions`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.status}`);
  }
  
  return response.json();
}

// Create new session
export async function createSession(documentId: number): Promise<Session> {
  const response = await fetch(`/api/documents/${documentId}/sessions`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.status}`);
  }
  
  return response.json();
}

// Get messages for a session
export async function getMessages(sessionId: number): Promise<Message[]> {
  const response = await fetch(`/api/sessions/${sessionId}/messages`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.status}`);
  }
  
  return response.json();
}

// Send message in chat
export async function sendMessage(documentId: number, message: string, sessionId?: number): Promise<{
  session: Session;
  userMessage: Message;
  aiMessage: Message;
}> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      documentId,
      message,
      sessionId,
    }),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status}`);
  }
  
  return response.json();
}
