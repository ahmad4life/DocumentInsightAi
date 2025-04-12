import { 
  User, InsertUser, 
  Document, InsertDocument,
  Message, InsertMessage,
  Session, InsertSession
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Session methods
  getSessions(documentId: number): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSessionName(id: number, name: string): Promise<Session | undefined>;
  
  // Message methods
  getMessages(sessionId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private sessions: Map<number, Session>;
  private messages: Map<number, Message>;
  private userIdCounter: number;
  private documentIdCounter: number;
  private sessionIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.sessions = new Map();
    this.messages = new Map();
    this.userIdCounter = 1;
    this.documentIdCounter = 1;
    this.sessionIdCounter = 1;
    this.messageIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Document methods
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const document: Document = { 
      ...insertDocument, 
      id, 
      uploadedAt: new Date() 
    };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Session methods
  async getSessions(documentId: number): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.documentId === documentId)
      .sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
  }

  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.sessionIdCounter++;
    const now = new Date();
    const session: Session = {
      ...insertSession,
      id,
      createdAt: now,
      lastMessageAt: now
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSessionName(id: number, name: string): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, name };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  // Message methods
  async getMessages(sessionId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.documentId === sessionId)
      .sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date()
    };
    this.messages.set(id, message);
    
    // Update session's lastMessageAt
    const sessions = Array.from(this.sessions.values());
    const session = sessions.find(s => s.id === insertMessage.documentId);
    if (session) {
      const updatedSession = { 
        ...session, 
        lastMessageAt: new Date() 
      };
      this.sessions.set(session.id, updatedSession);
    }
    
    return message;
  }
}

export const storage = new MemStorage();
