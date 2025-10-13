import { StorageProvider, StorageProviderType } from "./types";
import { S3StorageProvider } from "./s3-adapter";
import { AzureBlobStorageProvider } from "./azure-adapter";
import { GCSStorageProvider } from "./gcs-adapter";
import { LocalStorageProvider } from "./local-adapter";

let storageProviderInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (storageProviderInstance) {
    return storageProviderInstance;
  }

  const providerType = (process.env.STORAGE_PROVIDER || "local").toLowerCase();

  switch (providerType) {
    case StorageProviderType.AWS_S3:
    case "s3":
    case "aws":
      console.log("Using AWS S3 storage provider");
      storageProviderInstance = new S3StorageProvider();
      break;

    case StorageProviderType.AZURE_BLOB:
    case "azure":
    case "blob":
      console.log("Using Azure Blob storage provider");
      storageProviderInstance = new AzureBlobStorageProvider();
      break;

    case StorageProviderType.GCS:
    case "gcs":
    case "google":
    case "google-cloud":
      console.log("Using Google Cloud Storage provider");
      storageProviderInstance = new GCSStorageProvider();
      break;

    case StorageProviderType.LOCAL:
    case "local":
    case "filesystem":
      console.log("Using local filesystem storage provider");
      storageProviderInstance = new LocalStorageProvider();
      break;

    default:
      console.warn(
        `Unknown storage provider: ${providerType}. Falling back to local filesystem.`
      );
      storageProviderInstance = new LocalStorageProvider();
  }

  return storageProviderInstance;
}

export function resetStorageProvider(): void {
  storageProviderInstance = null;
}
