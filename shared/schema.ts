import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  originalName: text("originalName").notNull(),
  mimeType: text("mimeType").notNull(),
  size: integer("size").notNull(),
  content: text("content").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export const validFileTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => validFileTypes.includes(file.type),
    {
      message: "Invalid file format. Please upload only PDF, DOC, or TXT files.",
    }
  ),
});

export const chatSchema = z.object({
  documentId: z.number(),
  message: z.string(),
  sessionId: z.number().optional(),
});
