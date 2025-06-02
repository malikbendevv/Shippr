export interface UploadResponse {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

export interface MulterFile extends Express.Multer.File {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

export type MulterCallback = (error: Error | null, filename: string) => void;
export type SafeFileFilterCallback = (
  error: Error | null,
  acceptFile: boolean,
) => void;
