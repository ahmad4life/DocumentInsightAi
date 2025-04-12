import { useState } from "react";
import { useLocation } from "wouter";
import { Document, Session } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface SidebarProps {
  documents: Document[];
  activeDocumentId?: number;
  activeSessionId?: number;
  loading?: boolean;
  onNewChat?: () => void;
}

export default function Sidebar({
  documents,
  activeDocumentId,
  activeSessionId,
  loading = false,
  onNewChat,
}: SidebarProps) {
  const [, navigate] = useLocation();
  
  // Get sessions for active document
  const { data: sessions, isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: [`/api/documents/${activeDocumentId}/sessions`],
    enabled: !!activeDocumentId,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M9 13v4"/>
          <path d="M12 13v4"/>
          <path d="M15 13v4"/>
        </svg>
      );
    } else if (mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M10 13v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3"/>
          <rect x="8" y="13" width="8" height="4" rx="1"/>
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
      );
    }
  };

  return (
    <aside className="w-64 border-r border-[#E9ECEF] bg-white hidden md:block">
      <div className="p-4 border-b border-[#E9ECEF]">
        <Button 
          className="w-full bg-primary text-white hover:bg-blue-700"
          onClick={onNewChat}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Chat
        </Button>
      </div>
      
      <div className="p-4">
        <h2 className="text-sm font-semibold text-[#6C757D] uppercase tracking-wider mb-3">Documents</h2>
        
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg border border-[#E9ECEF]">
                <div className="flex items-start">
                  <Skeleton className="h-5 w-5 mr-3" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className={`document-card p-3 rounded-lg border cursor-pointer transition-all ${
                  activeDocumentId === doc.id
                    ? 'border-primary bg-blue-50'
                    : 'border-[#E9ECEF] hover:border-primary bg-white'
                }`}
                onClick={() => {
                  // If no active session, get first session or create a new one
                  if (sessions && sessions.length > 0) {
                    navigate(`/chat/${doc.id}/${sessions[0].id}`);
                  } else {
                    navigate(`/chat/${doc.id}/1`); // Default to first session
                  }
                }}
              >
                <div className="flex items-start">
                  <div className={`mr-3 ${activeDocumentId === doc.id ? 'text-primary' : 'text-[#6C757D]'}`}>
                    {getFileIcon(doc.mimeType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{doc.name}</h3>
                    <p className="text-xs text-[#6C757D] mt-1">
                      {formatFileSize(doc.size)} • Uploaded {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeDocumentId && sessions && sessions.length > 0 && (
        <div className="p-4 mt-4">
          <h2 className="text-sm font-semibold text-[#6C757D] uppercase tracking-wider mb-3">Recent Chats</h2>
          
          {sessionsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="p-2">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  className={`p-2 rounded-md cursor-pointer transition-colors ${
                    activeSessionId === session.id
                      ? 'bg-[#E9ECEF]'
                      : 'hover:bg-[#E9ECEF]'
                  }`}
                  onClick={() => navigate(`/chat/${activeDocumentId}/${session.id}`)}
                >
                  <p className="text-sm truncate">{session.name}</p>
                  <p className="text-xs text-[#6C757D] mt-1">
                    {formatDate(session.lastMessageAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
