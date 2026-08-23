export const PUBLIC_FILE_STATUSES = [
  "pending",
  "uploaded",
  "processing",
  "completed",
  "failed",
  "deleted",
] as const;

export type PublicFileStatus = (typeof PUBLIC_FILE_STATUSES)[number];

export type PublicFile = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  status: PublicFileStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type CreateUploadInput = {
  filename: string;
  contentType: string;
  size: number;
};

export type PresignedUpload = {
  url: string;
  method: "PUT";
  headers: {
    "Content-Type": string;
  };
  expiresInSeconds: number;
};

export type CreateUploadResponse = {
  file: PublicFile;
  upload: PresignedUpload;
};

export type FileListResponse = {
  files: PublicFile[];
  nextCursor: string | null;
};

export type FileDownloadResponse = {
  download: {
    url: string;
    expiresInSeconds: number;
  };
};
