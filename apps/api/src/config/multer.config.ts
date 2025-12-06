import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Injectable } from '@nestjs/common';
import { MulterOptionsFactory } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';

// Extension to MIME type mapping
const extensionToMimeType: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  gif: ['image/gif'],
  txt: ['text/plain'],
  zip: ['application/zip', 'application/x-zip-compressed'],
  rar: ['application/x-rar-compressed', 'application/vnd.rar'],
  csv: ['text/csv'],
  json: ['application/json'],
  xml: ['application/xml', 'text/xml'],
};

// Default settings (fallback if database is not available)
const DEFAULT_MAX_FILE_SIZE_MB = 10;
const DEFAULT_ALLOWED_FILE_TYPES = 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,zip,rar,txt';

/**
 * Dynamic Multer Configuration Factory
 * Reads settings from database for file size limits and allowed types
 */
@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  private cachedMaxFileSize: number | null = null;
  private cachedAllowedTypes: string[] | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  async createMulterOptions(): Promise<MulterOptions> {
    // Get settings with caching
    const maxFileSizeMB = await this.getMaxFileSizeMB();
    const allowedTypes = await this.getAllowedFileTypes();

    return {
      storage: diskStorage({
        destination: async (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'documents');

          try {
            await fs.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
          } catch (error) {
            cb(error as Error, uploadPath);
          }
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(7);
          const ext = path.extname(file.originalname);
          const filename = `${timestamp}-${randomString}${ext}`;
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: maxFileSizeMB * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = this.getAllowedMimeTypes(allowedTypes);

        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
        }
      },
    };
  }

  private async getMaxFileSizeMB(): Promise<number> {
    if (this.cachedMaxFileSize !== null && Date.now() < this.cacheExpiry) {
      return this.cachedMaxFileSize;
    }

    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'max_file_size_mb' },
      });
      this.cachedMaxFileSize = setting ? parseFloat(setting.value) : DEFAULT_MAX_FILE_SIZE_MB;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;
      return this.cachedMaxFileSize;
    } catch {
      return DEFAULT_MAX_FILE_SIZE_MB;
    }
  }

  private async getAllowedFileTypes(): Promise<string[]> {
    if (this.cachedAllowedTypes !== null && Date.now() < this.cacheExpiry) {
      return this.cachedAllowedTypes;
    }

    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'allowed_file_types' },
      });
      const typesString = setting?.value || DEFAULT_ALLOWED_FILE_TYPES;
      this.cachedAllowedTypes = typesString.split(',').map(t => t.trim().toLowerCase());
      this.cacheExpiry = Date.now() + this.CACHE_TTL;
      return this.cachedAllowedTypes;
    } catch {
      return DEFAULT_ALLOWED_FILE_TYPES.split(',').map(t => t.trim().toLowerCase());
    }
  }

  private getAllowedMimeTypes(extensions: string[]): string[] {
    const mimeTypes: string[] = [];
    for (const ext of extensions) {
      const types = extensionToMimeType[ext];
      if (types) {
        mimeTypes.push(...types);
      }
    }
    return mimeTypes;
  }

  // Method to invalidate cache (call when settings are updated)
  invalidateCache() {
    this.cachedMaxFileSize = null;
    this.cachedAllowedTypes = null;
    this.cacheExpiry = 0;
  }
}

/**
 * Static multer config (for cases where DI is not available)
 * Uses default values - for dynamic values use MulterConfigService
 */
export const multerConfig: MulterOptions = {
  storage: diskStorage({
    destination: async (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads', 'documents');

      try {
        await fs.mkdir(uploadPath, { recursive: true });
        cb(null, uploadPath);
      } catch (error) {
        cb(error as Error, uploadPath);
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const ext = path.extname(file.originalname);
      const filename = `${timestamp}-${randomString}${ext}`;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: DEFAULT_MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = DEFAULT_ALLOWED_FILE_TYPES.split(',').map(t => t.trim().toLowerCase());
    const mimeTypes: string[] = [];

    for (const ext of allowedExtensions) {
      const types = extensionToMimeType[ext];
      if (types) {
        mimeTypes.push(...types);
      }
    }

    if (mimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  },
};
