import { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useToast } from "@/hooks/use-toast";
import { validFileTypes } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Document } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { queryClient } from "@/lib/queryClient";

interface DocumentUploadProps {
  onUploadSuccess?: (document: Document, sessionId: number) => void;
}

export default function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to handle file drop/selection
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for valid file types
    const validFiles = acceptedFiles.filter(file => 
      validFileTypes.includes(file.type)
    );
    
    // Check if any files were filtered out
    if (validFiles.length < acceptedFiles.length) {
      toast({
        title: "Invalid file format",
        description: "Some files were rejected. Please upload only PDF, DOC, or TXT files.",
        variant: "destructive",
      });
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setError(null);
    }
  }, [toast]);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1, // Limit to one file at a time
  });

  // Handle file removal
  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  // Cancel upload
  const cancelUpload = () => {
    setSelectedFiles([]);
    setError(null);
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // Create simulated upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      try {
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        clearInterval(progressInterval);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Upload failed with status: ${response.status}`);
        }

        setUploadProgress(100);
        return await response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Reset state
      setSelectedFiles([]);
      setUploadProgress(0);
      setIsUploading(false);
      
      // Invalidate the documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      // Show success message
      toast({
        title: "Upload successful",
        description: "Your document has been uploaded and processed successfully.",
      });
      
      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(data.document, data.session.id);
      }
    },
    onError: (error) => {
      setIsUploading(false);
      setUploadProgress(0);
      
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Handle file upload
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      await uploadMutation.mutateAsync(selectedFiles[0]);
    } catch (error) {
      // Error is handled in mutation callbacks
    }
  };

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M9 13v4"/>
          <path d="M12 13v4"/>
          <path d="M15 13v4"/>
        </svg>
      );
    } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
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

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="text-5xl text-primary mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Upload your documents</h2>
          <p className="text-[#6C757D]">Upload your documents to start analyzing and asking questions</p>
        </div>
        
        {!isUploading && selectedFiles.length === 0 && (
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              isDragActive 
                ? 'border-primary bg-blue-50/20' 
                : 'border-[#E9ECEF]'
            }`}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <div className="text-[#6C757D] mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="42"
                height="42"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <p className="mb-2 font-medium">Drag and drop files here</p>
            <p className="text-sm text-[#6C757D] mb-4">or</p>
            <Button className="bg-primary hover:bg-blue-700">
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
              Select Files
            </Button>
            <p className="mt-4 text-sm text-[#6C757D]">Supported formats: PDF, DOC, TXT</p>
          </div>
        )}
        
        {/* File List */}
        {!isUploading && selectedFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-medium mb-2">Selected Files</h3>
            
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center bg-white p-3 rounded-md border border-[#E9ECEF]">
                <div className="mr-3 text-primary">
                  {getFileIcon(file)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-[#6C757D]">{formatFileSize(file.size)}</p>
                </div>
                <button 
                  className="text-[#6C757D] hover:text-[#DC3545] transition-colors" 
                  onClick={() => removeFile(index)}
                  aria-label="Remove file"
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
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
            
            <div className="mt-4 flex justify-end space-x-3">
              <Button
                variant="outline"
                className="text-[#6C757D] border-[#E9ECEF] hover:bg-[#E9ECEF]"
                onClick={cancelUpload}
              >
                Cancel
              </Button>
              <Button 
                className="bg-primary hover:bg-blue-700"
                onClick={uploadFiles}
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Upload Files
              </Button>
            </div>
          </div>
        )}
        
        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-6 space-y-3">
            <h3 className="font-medium mb-2">Uploading Files...</h3>
            <div className="bg-white p-4 rounded-md border border-[#E9ECEF]">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Processing documents</span>
                <span className="text-sm text-[#6C757D]">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-[#6C757D] mt-2">This might take a moment depending on file size</p>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-[#DC3545] text-[#DC3545] rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0 mr-3">
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
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Upload failed</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
