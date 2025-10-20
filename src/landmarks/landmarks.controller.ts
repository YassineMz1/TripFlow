import { Controller, Post, Body, UseInterceptors, UploadedFile, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LandmarksService } from './landmarks.service';
import { diskStorage } from 'multer';
import * as path from 'path';

@Controller('landmarks')
export class LandmarksController {
  constructor(private readonly landmarksService: LandmarksService) {}

  @Post('recognize-url')
  async recognizeFromUrl(@Body() body: { imageUrl: string }) {
    if (!body.imageUrl) {
      return { success: false, error: 'Image URL is required' };
    }

    try {
      const result = await this.landmarksService.detectLandmarkFromUrl(body.imageUrl);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('recognize-file')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
        cb(null, `${randomName}${path.extname(file.originalname)}`);
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }))
  async recognizeFromFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { success: false, error: 'No file uploaded' };
    }

    try {
      // Multer with diskStorage will provide a `path` property on the file object.
      // When memory storage is used, `buffer` will be available instead.
      const rawPath = (file as any).path ?? null;
      if (rawPath) {
        // Ensure we send an absolute path to the Python script so it treats it as a local file
        const absolutePath = path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
        return await this.landmarksService.detectLandmarkFromFile(absolutePath);
      }

      const fileBuffer = (file as any).buffer ?? null;
      if (fileBuffer) {
        return await this.landmarksService.detectLandmarkFromFile(fileBuffer);
      }

      return { success: false, error: 'Uploaded file missing buffer or disk path' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('health')
  async healthCheck() {
    return { 
      status: 'OK', 
      message: 'Landmarks recognition service is running',
      timestamp: new Date().toISOString()
    };
  }
}