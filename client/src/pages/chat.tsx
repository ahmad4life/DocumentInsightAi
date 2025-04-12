import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import { Document, Session, Message } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const params = useParams<{ documentId: string; sessionId: string }>();
  const documentId = parseInt(params.documentId);
  const sessionId = parseInt(params.sessionId);
  const { toast } = useToast();

  // Get document
  const { data: document, isLoading: isDocumentLoading, error: documentError } = useQuery<Document>({
    queryKey: [`/api/documents/${documentId}`],
    enabled: !isNaN(documentId),
  });

  // Get documents for sidebar
  const { data: documents, isLoading: isDocumentsLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  // Get messages for this session
  const { data: messages, isLoading: isMessagesLoading, error: messagesError } = useQuery<Message[]>({
    queryKey: [`/api/sessions/${sessionId}/messages`],
    enabled: !isNaN(sessionId),
  });

  // Handle errors
  useEffect(() => {
    if (documentError) {
      toast({
        title: "Error",
        description: "Failed to load document. Please try again.",
        variant: "destructive",
      });
    }
    
    if (messagesError) {
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive",
      });
    }
  }, [documentError, messagesError, toast]);

  // Send message mutation
  const chatMutation = useMutation({
    mutationFn: (message: string) => {
      return apiRequest('POST', '/api/chat', {
        documentId,
        message,
        sessionId,
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh messages
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/messages`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  });

  // Handle sending a new message
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    await chatMutation.mutateAsync(message);
  };

  const isLoading = isDocumentLoading || isMessagesLoading;

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar 
        documents={documents || []} 
        activeDocumentId={documentId}
        activeSessionId={sessionId}
        loading={isDocumentsLoading} 
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {document && (
          <ChatInterface 
            document={document}
            messages={messages || []} 
            isLoading={isLoading}
            isPending={chatMutation.isPending}
            onSendMessage={handleSendMessage}
          />
        )}
      </main>
    </div>
  );
}
