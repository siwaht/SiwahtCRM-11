import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  ContainerClient,
  BlockBlobClient,
} from "@azure/storage-blob";
import { Response } from "express";
import {
  StorageFile,
  StorageFileMetadata,
  StorageProvider,
  SignedUrlOptions,
} from "./types";

export class AzureBlobStorageFile implements StorageFile {
  private blobClient: BlockBlobClient;

  constructor(
    containerClient: ContainerClient,
    private blobName: string
  ) {
    this.blobClient = containerClient.getBlockBlobClient(blobName);
  }

  async exists(): Promise<boolean> {
    return this.blobClient.exists();
  }

  async download(res: Response, cacheTtlSec: number = 3600): Promise<void> {
    try {
      const downloadResponse = await this.blobClient.download();
      const properties = await this.blobClient.getProperties();
      
      const isPublic = properties.metadata?.["aclvisibility"] === "public";
      
      res.set({
        "Content-Type": properties.contentType || "application/octet-stream",
        "Content-Length": properties.contentLength?.toString() || "0",
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
      });

      if (downloadResponse.readableStreamBody) {
        downloadResponse.readableStreamBody.on("error", (err: Error) => {
          console.error("Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error streaming file" });
          }
        });

        downloadResponse.readableStreamBody.pipe(res);
      } else {
        throw new Error("No body in Azure blob response");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getMetadata(): Promise<StorageFileMetadata> {
    const properties = await this.blobClient.getProperties();

    return {
      contentType: properties.contentType,
      size: properties.contentLength,
      customMetadata: properties.metadata || {},
    };
  }

  async setMetadata(metadata: Record<string, string>): Promise<void> {
    const currentMetadata = await this.getMetadata();
    
    await this.blobClient.setMetadata({
      ...currentMetadata.customMetadata,
      ...metadata,
    });
  }

  async delete(): Promise<void> {
    await this.blobClient.delete();
  }
}

export class AzureBlobStorageProvider implements StorageProvider {
  private blobServiceClient: BlobServiceClient;
  private credential?: StorageSharedKeyCredential;

  constructor() {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (connectionString) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    } else if (accountName && accountKey) {
      this.credential = new StorageSharedKeyCredential(accountName, accountKey);
      this.blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        this.credential
      );
    } else {
      throw new Error(
        "Azure storage configuration missing. Set AZURE_STORAGE_CONNECTION_STRING or " +
        "(AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY)"
      );
    }
  }

  getFile(containerName: string, blobName: string): StorageFile {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    return new AzureBlobStorageFile(containerClient, blobName);
  }

  async getSignedUrl(
    containerName: string,
    blobName: string,
    options: SignedUrlOptions
  ): Promise<string> {
    if (!this.credential) {
      throw new Error(
        "Cannot generate SAS tokens without account credentials. " +
        "Use AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY"
      );
    }

    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    const permissions = new BlobSASPermissions();
    if (options.method === "GET" || options.method === "HEAD") {
      permissions.read = true;
    } else if (options.method === "PUT") {
      permissions.write = true;
      permissions.create = true;
    } else if (options.method === "DELETE") {
      permissions.delete = true;
    }

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions,
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + options.expiresInSeconds * 1000),
      },
      this.credential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  }

  parsePath(path: string): { bucketName: string; objectName: string } {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    const pathParts = path.split("/");
    if (pathParts.length < 3) {
      throw new Error("Invalid path: must contain at least a container name");
    }

    const containerName = pathParts[1];
    const blobName = pathParts.slice(2).join("/");

    return { bucketName: containerName, objectName: blobName };
  }

  getProviderName(): string {
    return "azure-blob";
  }
}
