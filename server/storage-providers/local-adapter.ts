import fs from "fs/promises";
import path from "path";
import { Response } from "express";
import {
  StorageFile,
  StorageFileMetadata,
  StorageProvider,
  SignedUrlOptions,
} from "./types";

export class LocalStorageFile implements StorageFile {
  private filePath: string;
  private metadataPath: string;

  constructor(
    private basePath: string,
    private bucketName: string,
    private objectName: string
  ) {
    this.filePath = path.join(basePath, bucketName, objectName);
    this.metadataPath = `${this.filePath}.metadata.json`;
  }

  async exists(): Promise<boolean> {
    try {
      await fs.access(this.filePath);
      return true;
    } catch {
      return false;
    }
  }

  async download(res: Response, cacheTtlSec: number = 3600): Promise<void> {
    try {
      const metadata = await this.getMetadata();
      const isPublic = metadata.customMetadata?.["aclvisibility"] === "public";
      
      const stats = await fs.stat(this.filePath);
      
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": stats.size.toString(),
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
      });

      const stream = (await import("fs")).createReadStream(this.filePath);
      
      stream.on("error", (err: Error) => {
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
    try {
      const metadataContent = await fs.readFile(this.metadataPath, "utf-8");
      return JSON.parse(metadataContent);
    } catch {
      const stats = await fs.stat(this.filePath);
      return {
        contentType: "application/octet-stream",
        size: stats.size,
        customMetadata: {},
      };
    }
  }

  async setMetadata(metadata: Record<string, string>): Promise<void> {
    const currentMetadata = await this.getMetadata();
    const updatedMetadata = {
      ...currentMetadata,
      customMetadata: {
        ...currentMetadata.customMetadata,
        ...metadata,
      },
    };
    
    await fs.writeFile(
      this.metadataPath,
      JSON.stringify(updatedMetadata, null, 2),
      "utf-8"
    );
  }

  async delete(): Promise<void> {
    await fs.unlink(this.filePath);
    try {
      await fs.unlink(this.metadataPath);
    } catch {
      // Ignore if metadata file doesn't exist
    }
  }
}

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor() {
    this.basePath = process.env.LOCAL_STORAGE_PATH || "./storage";
  }

  getFile(bucketName: string, objectName: string): StorageFile {
    return new LocalStorageFile(this.basePath, bucketName, objectName);
  }

  async getSignedUrl(
    bucketName: string,
    objectName: string,
    options: SignedUrlOptions
  ): Promise<string> {
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const token = Buffer.from(
      JSON.stringify({
        bucket: bucketName,
        object: objectName,
        method: options.method,
        exp: Date.now() + options.expiresInSeconds * 1000,
      })
    ).toString("base64url");
    
    return `${baseUrl}/api/storage/signed/${token}`;
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
    return "local-filesystem";
  }
}
