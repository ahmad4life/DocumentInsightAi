import { useState, useRef, useEffect } from "react";
import { Document, Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatInterfaceProps {
  document: Document;
  messages: Message[];
  isLoading: boolean;
  isPending: boolean;
  onSendMessage: (message: string) => void;
}

export default function ChatInterface({
  document,
  messages,
  isLoading,
  isPending,
  onSendMessage,
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Get file icon based on mime type
  const getFileIcon = () => {
    if (document.mimeType === 'application/pdf') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M9 13v4"/>
          <path d="M12 13v4"/>
          <path d="M15 13v4"/>
        </svg>
      );
    } else if (document.mimeType === 'application/msword' || document.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M10 13v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3"/>
          <rect x="8" y="13" width="8" height="4" rx="1"/>
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
      );
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  // Send message on form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isPending) {
      onSendMessage(inputMessage);
      setInputMessage("");
    }
  };

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  // Handle sending suggestion
  const handleSendSuggestion = (suggestion: string) => {
    if (!isPending) {
      onSendMessage(suggestion);
    }
  };

  const renderMessageContent = (content: string) => {
    // Simple processing to handle markdown-like formatting
    // This is a basic implementation - a real markdown parser would be better
    
    // Handle ordered lists
    content = content.replace(/\n(\d+\.\s.+)(\n|$)/g, (match, p1) => {
      return `\n<li>${p1.replace(/^\d+\.\s/, '')}</li>\n`;
    });
    
    if (content.includes('<li>')) {
      content = `<ol class="list-decimal pl-5 space-y-1">${content}</ol>`;
    }
    
    // Handle paragraphs
    const paragraphs = content.split('\n\n');
    return paragraphs.map((para, index) => {
      if (para.includes('<ol')) {
        return <div key={index} dangerouslySetInnerHTML={{ __html: para }} />;
      }
      return <p key={index} className="mb-2">{para}</p>;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Document Info Bar */}
      <div className="bg-white border-b border-[#E9ECEF] p-3 flex items-center">
        <div className="mr-3 text-primary">
          {getFileIcon()}
        </div>
        <div className="flex-1">
          <h2 className="font-medium">{document.name}</h2>
          <p className="text-xs text-[#6C757D]">{formatFileSize(document.size)}</p>
        </div>
        <div>
          <button className="text-[#6C757D] hover:text-primary transition-colors p-2" aria-label="Document settings">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Chat Messages Area */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            <div className="flex items-start">
              <Skeleton className="h-8 w-8 rounded-full mr-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full max-w-md" />
              </div>
            </div>
            <div className="flex items-end justify-end">
              <div className="space-y-2">
                <Skeleton className="h-12 w-full max-w-sm" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full ml-3" />
            </div>
          </div>
        ) : (
          // Actual messages
          <div className="space-y-4">
            {messages.map((msg, index) => {
              if (msg.role === 'system' || msg.role === 'assistant') {
                return (
                  <div key={index} className="chat-message bot-message max-w-[80%] bg-white rounded-lg p-3 mr-auto">
                    <div className="flex items-start">
                      <div className="mr-3 flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
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
                        >
                          <path d="M12 8V4H8"></path>
                          <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                          <path d="M2 14h2"></path>
                          <path d="M20 14h2"></path>
                          <path d="M15 13v2"></path>
                          <path d="M9 13v2"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium mb-1">DocuChat</p>
                        <div className="space-y-2">
                          {renderMessageContent(msg.content)}
                          
                          {/* Show suggestions only on the first system message */}
                          {index === 0 && msg.role === 'system' && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button 
                                className="bg-blue-50 text-primary px-3 py-1 rounded-full text-sm hover:bg-blue-100 transition-colors"
                                onClick={() => handleSendSuggestion("Summarize the document")}
                              >
                                Summarize the document
                              </button>
                              <button 
                                className="bg-blue-50 text-primary px-3 py-1 rounded-full text-sm hover:bg-blue-100 transition-colors"
                                onClick={() => handleSendSuggestion("Extract key points")}
                              >
                                Extract key points
                              </button>
                              <button 
                                className="bg-blue-50 text-primary px-3 py-1 rounded-full text-sm hover:bg-blue-100 transition-colors"
                                onClick={() => handleSendSuggestion("Generate questions")}
                              >
                                Generate questions
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={index} className="chat-message user-message max-w-[80%] bg-[#E3F2FD] rounded-lg p-3 ml-auto">
                    <div className="flex items-start justify-end">
                      <div>
                        <p>{msg.content}</p>
                      </div>
                      <div className="ml-3 flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">
                        DC
                      </div>
                    </div>
                  </div>
                );
              }
            })}
            
            {/* Typing indicator when loading */}
            {isPending && (
              <div className="chat-message bot-message max-w-[80%] bg-white rounded-lg p-3 mr-auto">
                <div className="flex items-start">
                  <div className="mr-3 flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
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
                    >
                      <path d="M12 8V4H8"></path>
                      <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                      <path d="M2 14h2"></path>
                      <path d="M20 14h2"></path>
                      <path d="M15 13v2"></path>
                      <path d="M9 13v2"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium mb-1">DocuChat</p>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Chat Input Area */}
      <div className="p-4 border-t border-[#E9ECEF] bg-white">
        <form className="flex items-end gap-2" onSubmit={handleSubmit}>
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              rows={1}
              className="w-full border border-[#E9ECEF] rounded-lg py-3 px-4 pr-10 resize-none focus:outline-none focus:border-primary"
              placeholder="Ask a question about your document..."
              maxLength={500}
            />
            <button 
              type="button" 
              className="absolute right-3 bottom-3 text-[#6C757D] hover:text-primary transition-colors"
              aria-label="Upload file"
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
              >
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </button>
          </div>
          <Button 
            type="submit" 
            className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-700 transition-colors p-0"
            disabled={isPending || !inputMessage.trim()}
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
            >
              <path d="m22 2-7 20-4-9-9-4Z"></path>
              <path d="M22 2 11 13"></path>
            </svg>
          </Button>
        </form>
        <div className="mt-2 text-xs text-[#6C757D] text-center">
          Powered by Groq technology
        </div>
      </div>
    </div>
  );
}
