import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import {
  StorageFile,
  StorageFileMetadata,
  StorageProvider,
  SignedUrlOptions,
} from "./types";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export class GCSStorageFile implements StorageFile {
  constructor(private file: File) {}

  async exists(): Promise<boolean> {
    const [exists] = await this.file.exists();
    return exists;
  }

  async download(res: Response, cacheTtlSec: number = 3600): Promise<void> {
    try {
      const [metadata] = await this.file.getMetadata();
      
      const isPublic = metadata.metadata?.["aclvisibility"] === "public";
      
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
      });

      const stream = this.file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getMetadata(): Promise<StorageFileMetadata> {
    const [metadata] = await this.file.getMetadata();

    return {
      contentType: metadata.contentType,
      size: metadata.size ? parseInt(metadata.size.toString()) : undefined,
      customMetadata: (metadata.metadata as Record<string, string>) || {},
    };
  }

  async setMetadata(metadata: Record<string, string>): Promise<void> {
    const currentMetadata = await this.getMetadata();
    
    await this.file.setMetadata({
      metadata: {
        ...currentMetadata.customMetadata,
        ...metadata,
      },
    });
  }

  async delete(): Promise<void> {
    await this.file.delete();
  }
}

export class GCSStorageProvider implements StorageProvider {
  private client: Storage;
  private useReplitSidecar: boolean;

  constructor() {
    this.useReplitSidecar = process.env.USE_REPLIT_OBJECT_STORAGE === "true";

    if (this.useReplitSidecar) {
      this.client = new Storage({
        credentials: {
          audience: "replit",
          subject_token_type: "access_token",
          token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
          type: "external_account",
          credential_source: {
            url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
            format: {
              type: "json",
              subject_token_field_name: "access_token",
            },
          },
          universe_domain: "googleapis.com",
        },
        projectId: "",
      });
    } else {
      const projectId = process.env.GCP_PROJECT_ID;
      const keyFilename = process.env.GCP_KEY_FILENAME;

      this.client = new Storage({
        projectId,
        keyFilename,
      });
    }
  }

  getFile(bucketName: string, objectName: string): StorageFile {
    const bucket = this.client.bucket(bucketName);
    const file = bucket.file(objectName);
    return new GCSStorageFile(file);
  }

  async getSignedUrl(
    bucketName: string,
    objectName: string,
    options: SignedUrlOptions
  ): Promise<string> {
    if (this.useReplitSidecar) {
      return this.getReplitSignedUrl(bucketName, objectName, options);
    }

    const bucket = this.client.bucket(bucketName);
    const file = bucket.file(objectName);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: options.method.toLowerCase() as any,
      expires: Date.now() + options.expiresInSeconds * 1000,
    });

    return url;
  }

  private async getReplitSignedUrl(
    bucketName: string,
    objectName: string,
    options: SignedUrlOptions
  ): Promise<string> {
    const request = {
      bucket_name: bucketName,
      object_name: objectName,
      method: options.method,
      expires_at: new Date(Date.now() + options.expiresInSeconds * 1000).toISOString(),
    };

    const response = await fetch(
      `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to sign object URL, errorcode: ${response.status}`
      );
    }

    const { signed_url: signedURL } = await response.json();
    return signedURL;
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
    return "google-cloud-storage";
  }
}
