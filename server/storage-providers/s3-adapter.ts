import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import {
  StorageFile,
  StorageFileMetadata,
  StorageProvider,
  SignedUrlOptions,
} from "./types";

export class S3StorageFile implements StorageFile {
  constructor(
    private client: S3Client,
    private bucketName: string,
    private objectName: string
  ) {}

  async exists(): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: this.objectName,
        })
      );
      return true;
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async download(res: Response, cacheTtlSec: number = 3600): Promise<void> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: this.objectName,
      });

      const response = await this.client.send(command);
      
      const isPublic = response.Metadata?.["aclvisibility"] === "public";
      
      res.set({
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Length": response.ContentLength?.toString() || "0",
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
      });

      if (response.Body) {
        const stream = response.Body as any;
        
        stream.on("error", (err: Error) => {
          console.error("Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error streaming file" });
          }
        });

        stream.pipe(res);
      } else {
        throw new Error("No body in S3 response");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getMetadata(): Promise<StorageFileMetadata> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: this.objectName,
    });

    const response = await this.client.send(command);

    return {
      contentType: response.ContentType,
      size: response.ContentLength,
      customMetadata: response.Metadata || {},
    };
  }

  async setMetadata(metadata: Record<string, string>): Promise<void> {
    const currentMetadata = await this.getMetadata();
    
    const headCommand = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: this.objectName,
    });
    const headResponse = await this.client.send(headCommand);
    
    const encodedKey = this.objectName.split('/').map(segment => encodeURIComponent(segment)).join('/');
    
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      Key: this.objectName,
      CopySource: `${this.bucketName}/${encodedKey}`,
      Metadata: {
        ...currentMetadata.customMetadata,
        ...metadata,
      },
      ContentType: headResponse.ContentType,
      CacheControl: headResponse.CacheControl,
      ContentDisposition: headResponse.ContentDisposition,
      ContentEncoding: headResponse.ContentEncoding,
      ContentLanguage: headResponse.ContentLanguage,
      MetadataDirective: "REPLACE",
    });

    await this.client.send(command);
  }

  async delete(): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: this.objectName,
    });

    await this.client.send(command);
  }
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;

  constructor() {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
    
    this.client = new S3Client({
      region,
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
    });
  }

  getFile(bucketName: string, objectName: string): StorageFile {
    return new S3StorageFile(this.client, bucketName, objectName);
  }

  async getSignedUrl(
    bucketName: string,
    objectName: string,
    options: SignedUrlOptions
  ): Promise<string> {
    let command;
    
    switch (options.method) {
      case "GET":
        command = new GetObjectCommand({ Bucket: bucketName, Key: objectName });
        break;
      case "PUT":
        command = new PutObjectCommand({ Bucket: bucketName, Key: objectName });
        break;
      case "DELETE":
        command = new DeleteObjectCommand({ Bucket: bucketName, Key: objectName });
        break;
      case "HEAD":
        command = new HeadObjectCommand({ Bucket: bucketName, Key: objectName });
        break;
    }

    return getSignedUrl(this.client, command as any, {
      expiresIn: options.expiresInSeconds,
    });
  }

  parsePath(path: string): { bucketName: string; objectName: string } {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    const pathParts = path.split("/");
    if (pathParts.length < 3) {
      throw new Error("Invalid path: must contain at least a bucket name");
    }

    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join("/");

    return { bucketName, objectName };
  }

  getProviderName(): string {
    return "aws-s3";
  }
}
