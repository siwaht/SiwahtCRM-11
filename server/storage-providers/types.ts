import { Response } from "express";

export interface StorageFile {
  exists(): Promise<boolean>;
  download(res: Response, cacheTtlSec?: number): Promise<void>;
  getMetadata(): Promise<StorageFileMetadata>;
  setMetadata(metadata: Record<string, string>): Promise<void>;
  delete(): Promise<void>;
}

export interface StorageFileMetadata {
  contentType?: string;
  size?: number;
  customMetadata?: Record<string, string>;
}

export interface SignedUrlOptions {
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  expiresInSeconds: number;
}

export interface StorageProvider {
  getFile(bucketName: string, objectName: string): StorageFile;
  
  getSignedUrl(
    bucketName: string,
    objectName: string,
    options: SignedUrlOptions
  ): Promise<string>;
  
  parsePath(path: string): {
    bucketName: string;
    objectName: string;
  };
  
  getProviderName(): string;
}

export enum StorageProviderType {
  GCS = "gcs",
  AWS_S3 = "s3",
  AZURE_BLOB = "azure",
  LOCAL = "local",
}
