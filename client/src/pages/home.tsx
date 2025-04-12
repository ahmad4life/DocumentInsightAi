import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DocumentUpload from "@/components/DocumentUpload";
import Sidebar from "@/components/Sidebar";
import { Document } from "@/lib/types";
import { useLocation } from "wouter";

export default function Home() {
  const [isUploadVisible, setIsUploadVisible] = useState(true);
  const [, navigate] = useLocation();
  
  const { data: documents, isLoading, error } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  // If there are documents, show upload interface initially
  // If there are no documents, show empty state
  const hasDocuments = documents && documents.length > 0;
  
  // Function to handle successful document upload
  const handleUploadSuccess = (document: Document, sessionId: number) => {
    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    navigate(`/chat/${document.id}/${sessionId}`);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {hasDocuments && (
        <Sidebar 
          documents={documents || []} 
          onNewChat={() => setIsUploadVisible(true)}
          loading={isLoading}
        />
      )}
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {(isUploadVisible || !hasDocuments) && (
          <DocumentUpload onUploadSuccess={handleUploadSuccess} />
        )}
      </main>
    </div>
  );
}
