import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  storageUsed?: number;
  storageLimit?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides an inline interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that shows an inline upload interface
 * - Provides an inline interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  storageUsed = 0,
  storageLimit = 524288000, // 500MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const storageAvailable = storageLimit - storageUsed;
  const storageUsedPercent = Math.round((storageUsed / storageLimit) * 100);
  const [showUploader, setShowUploader] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const addDebug = (message: string) => {
    console.log('ObjectUploader Debug:', message);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize: Math.min(maxFileSize, Math.max(storageAvailable, 1024)), // Ensure at least 1KB minimum
      },
      autoProceed: false,
    });
    
    uppyInstance.use(AwsS3, {
      shouldUseMultipart: false,
      getUploadParameters: async () => {
        try {
          addDebug('Attempting to get upload parameters...');
          const result = await onGetUploadParameters();
          addDebug(`Got upload parameters: method=${result.method}, url length=${result.url?.length || 0}`);
          return result;
        } catch (error) {
          addDebug(`Error getting upload parameters: ${error}`);
          console.error('Upload parameters error:', error);
          throw error;
        }
      },
    });
    
    uppyInstance.on("complete", (result) => {
      onComplete?.(result);
      // Auto-hide uploader after successful upload
      if (result.successful && result.successful.length > 0) {
        setTimeout(() => setShowUploader(false), 1500);
      }
    });
    
    uppyInstance.on("upload-error", (file, error) => {
      console.error('Upload error:', error);
      addDebug(`Upload error: ${error}`);
    });
    
    uppyInstance.on('file-added', (file) => {
      addDebug(`File added: ${file.name} (${file.size} bytes)`);
    });
    
    uppyInstance.on('upload', () => {
      addDebug('Upload started');
    });
    
    return uppyInstance;
  });

  // DashboardModal handles its own backdrop clicks and escape key

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      {/* Storage Usage Display */}
      <div className="mb-4 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-300">Storage Usage</span>
          <span className="text-sm text-slate-400">
            {formatFileSize(storageUsed)} / {formatFileSize(storageLimit)}
          </span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              storageUsedPercent > 90 ? 'bg-red-500' : 
              storageUsedPercent > 75 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(storageUsedPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-slate-400">
          <span>{storageUsedPercent}% used</span>
          <span>{formatFileSize(storageAvailable)} available</span>
        </div>
      </div>

      <Button 
        onClick={() => {
          addDebug(`Button clicked, toggling uploader: ${!showUploader}`);
          setShowUploader(!showUploader);
        }} 
        className={buttonClassName}
        disabled={storageAvailable <= 1024} // Disable if less than 1KB available
      >
        {children}
      </Button>
      {storageAvailable <= 1024 && (
        <p className="text-red-400 text-sm mt-2">Storage limit reached. Please contact support to upgrade.</p>
      )}

      <DashboardModal
        uppy={uppy}
        open={showUploader}
        onRequestClose={() => {
          addDebug('Modal close requested');
          setShowUploader(false);
        }}
        proudlyDisplayPoweredByUppy={false}
        showProgressDetails={true}
        hideUploadButton={false}
        hideCancelButton={false}
        hideRetryButton={false}
        hidePauseResumeButton={false}
      />
      
      {/* Debug Info - remove after testing */}
      {debugInfo.length > 0 && process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-slate-900/80 border border-slate-600/50 rounded-lg text-xs">
          <div className="text-slate-300 font-medium mb-2">Upload Debug Log:</div>
          {debugInfo.map((info, index) => (
            <div key={index} className="text-slate-400 font-mono">
              {info}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}