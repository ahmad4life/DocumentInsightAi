import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { ParsedQs } from "qs";
import { 
  insertDocumentSchema, 
  fileUploadSchema, 
  chatSchema, 
  validFileTypes,
  insertSessionSchema,
  insertMessageSchema
} from "@shared/schema";
import { processFile } from "./utils/fileProcessing";
import { groqChatCompletion } from "./utils/groqApi";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;
    
    if (
      (fileExtension === '.pdf' && mimeType === 'application/pdf') ||
      (['.doc', '.docx'].includes(fileExtension) && ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mimeType)) ||
      (fileExtension === '.txt' && mimeType === 'text/plain')
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Please upload only PDF, DOC, or TXT files."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Get all documents
  app.get('/api/documents', async (_req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.status(200).json(documents);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to retrieve documents',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get document by ID
  app.get('/api/documents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.status(200).json(document);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to retrieve document',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Upload document
  app.post('/api/documents/upload', upload.single('file'), async (req: Request & { file?: Express.Multer.File }, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Check if file type is valid
      if (!validFileTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          message: 'Invalid file format. Please upload only PDF, DOC, or TXT files.' 
        });
      }

      // Process file to extract content
      const content = await processFile(req.file);
      if (!content) {
        return res.status(400).json({ message: 'Failed to process file' });
      }

      // Create document record
      const document = await storage.createDocument({
        name: req.file.originalname,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        content,
      });

      // Create initial session for this document
      const session = await storage.createSession({
        documentId: document.id,
        name: `Chat about ${document.name}`
      });

      // Add initial system message
      await storage.createMessage({
        documentId: session.id,
        role: 'system',
        content: `I've processed your ${document.name} document. What would you like to know about it?`
      });

      res.status(201).json({ document, session });
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to upload document',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete document
  app.delete('/api/documents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      await storage.deleteDocument(id);
      res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to delete document',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get sessions for a document
  app.get('/api/documents/:id/sessions', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const sessions = await storage.getSessions(id);
      res.status(200).json(sessions);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to retrieve sessions',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create new session
  app.post('/api/documents/:id/sessions', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const session = await storage.createSession({
        documentId: id,
        name: `Chat about ${document.name}`
      });

      // Add initial system message
      await storage.createMessage({
        documentId: session.id,
        role: 'system',
        content: `I've processed your ${document.name} document. What would you like to know about it?`
      });

      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to create session',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get messages for a session
  app.get('/api/sessions/:id/messages', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid session ID' });
      }

      const session = await storage.getSession(id);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const messages = await storage.getMessages(id);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to retrieve messages',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Chat with document
  app.post('/api/chat', async (req, res) => {
    try {
      const validation = chatSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid request body',
          errors: validation.error.format()
        });
      }

      const { documentId, message, sessionId } = validation.data;

      // Verify document exists
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Get or create session
      let session;
      if (sessionId) {
        session = await storage.getSession(sessionId);
        if (!session) {
          return res.status(404).json({ message: 'Session not found' });
        }
      } else {
        session = await storage.createSession({
          documentId,
          name: `Chat about ${document.name}`
        });
      }

      // Add user message
      const userMessage = await storage.createMessage({
        documentId: session.id,
        role: 'user',
        content: message
      });

      // Get all messages in the conversation
      const sessionMessages = await storage.getMessages(session.id);
      
      // Create system prompt with document content
      const systemPrompt = `You're an AI assistant specialized in helping users analyze documents. Refer to the document content below when answering questions. If you can't find relevant information in the document, be honest about it.

Document Content:
${document.content}

Answer the question based on the document content. Be clear, concise, and helpful.`;

      // Format messages for GROQ API
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...sessionMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      // Call GROQ API to get response
      const responseContent = await groqChatCompletion(formattedMessages);

      // Store AI response
      const aiMessage = await storage.createMessage({
        documentId: session.id,
        role: 'assistant',
        content: responseContent
      });

      res.status(200).json({
        session,
        userMessage,
        aiMessage
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to process chat request',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
