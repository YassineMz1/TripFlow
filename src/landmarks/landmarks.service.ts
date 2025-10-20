import { Injectable, OnModuleInit } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const execAsync = promisify(exec);

@Injectable()
export class LandmarksService implements OnModuleInit {
  private pythonScriptPath: string;

  async onModuleInit() {
    this.pythonScriptPath = path.join(process.cwd(), 'python-scripts', 'landmark_detector.py');
  }

  async detectLandmarkFromUrl(imageUrl: string): Promise<any> {
    try {
      console.log(`🔍 Processing image: ${imageUrl}`);
      
  // Use venv Python executable to run the script (Windows)
  const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  const cmd = `"${venvPython}" "${this.pythonScriptPath}" "${imageUrl}"`;
  const { stdout, stderr } = await execAsync(cmd);
      
      if (stderr) {
        console.log('Python stderr:', stderr);
      }

      const result = JSON.parse(stdout);
      
      if (result.success) {
        // Support two possible script outputs:
        // - legacy: { success: true, predictions: [ { landmark_name, confidence, class_id, ... }, ... ] }
        // - new: { success: true, best_prediction: { landmark_name, confidence, model_name, class_id, ... }, total_models_tested }
        let landmarksArray: any[] = [];

        if (Array.isArray(result.predictions) && result.predictions.length > 0) {
          landmarksArray = result.predictions.map((pred: any) => ({
            name: pred.landmark_name,
            confidence: Math.round((pred.confidence ?? 0) * 10000) / 100,
            rank: pred.rank ?? null,
            landmark_id: pred.class_id ?? pred.classId ?? null,
          }));
        } else if (result.best_prediction && typeof result.best_prediction === 'object') {
          const p = result.best_prediction;
          landmarksArray = [{
            name: p.landmark_name ?? p.landmarkName ?? p.landmark ?? null,
            confidence: Math.round((p.confidence ?? 0) * 10000) / 100,
            rank: null,
            landmark_id: p.class_id ?? p.classId ?? null,
          }];
        }

        return {
          success: true,
          landmarks: landmarksArray,
          provider: result.provider ?? (result.best_prediction ? result.best_prediction.model_type : undefined),
          model_used: result.model_used ?? (result.best_prediction ? result.best_prediction.model_name : undefined),
          total_predictions: Array.isArray(result.predictions) ? result.predictions.length : (typeof result.total_models_tested === 'number' ? result.total_models_tested : landmarksArray.length),
        };
      } else {
        return {
          success: false,
          error: result.error,
          note: 'Landmark recognition failed - the model might still be downloading'
        };
      }
    } catch (error) {
      console.error('Python script error:', error);
      return {
        success: false,
        error: 'Landmark recognition service unavailable',
        note: 'Make sure Python dependencies are installed and models are downloaded'
      };
    }
  }

  async detectLandmarkFromFile(fileBuffer: Buffer): Promise<any> {
    // Accept either a Buffer or a local file path
    let tempFilePath: string | null = null;
    let inputPath: string;

    try {
      if (typeof fileBuffer === 'string') {
        // Caller passed a file path
        inputPath = fileBuffer as unknown as string;
      } else if (Buffer.isBuffer(fileBuffer)) {
        // Write buffer to a temporary file
  const tmpDir = os.tmpdir();
  const filename = `landmark-${Date.now()}-${Math.floor(Math.random()*1e9).toString(16)}.jpg`;
  tempFilePath = path.join(tmpDir, filename);
        await fs.promises.writeFile(tempFilePath, fileBuffer);
        inputPath = tempFilePath;
      } else {
        return { success: false, error: 'Unsupported file input' };
      }

      // Use venv Python executable to run the script (Windows)
      const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
      const cmd = `"${venvPython}" "${this.pythonScriptPath}" "${inputPath.replace(/"/g, '\\"')}"`;
      const { stdout, stderr } = await execAsync(cmd);

      if (stderr) {
        console.log('Python stderr:', stderr);
      }

      const result = JSON.parse(stdout);

      if (result.success) {
        let landmarksArray: any[] = [];

        if (Array.isArray(result.predictions) && result.predictions.length > 0) {
          landmarksArray = result.predictions.map((pred: any) => ({
            name: pred.landmark_name,
            confidence: Math.round((pred.confidence ?? 0) * 10000) / 100,
            rank: pred.rank ?? null,
            landmark_id: pred.class_id ?? pred.classId ?? null,
          }));
        } else if (result.best_prediction && typeof result.best_prediction === 'object') {
          const p = result.best_prediction;
          landmarksArray = [{
            name: p.landmark_name ?? p.landmarkName ?? p.landmark ?? null,
            confidence: Math.round((p.confidence ?? 0) * 10000) / 100,
            rank: null,
            landmark_id: p.class_id ?? p.classId ?? null,
          }];
        }

        return {
          success: true,
          landmarks: landmarksArray,
          provider: result.provider ?? (result.best_prediction ? result.best_prediction.model_type : undefined),
          model_used: result.model_used ?? (result.best_prediction ? result.best_prediction.model_name : undefined),
          total_predictions: Array.isArray(result.predictions) ? result.predictions.length : (typeof result.total_models_tested === 'number' ? result.total_models_tested : landmarksArray.length),
        };
      } else {
        return {
          success: false,
          error: result.error,
          note: 'Landmark recognition failed - the model might still be downloading'
        };
      }
    } catch (error) {
      console.error('Python script error:', error);
      return {
        success: false,
        error: 'Landmark recognition service unavailable',
        note: 'Make sure Python dependencies are installed and models are downloaded'
      };
    } finally {
      // Cleanup temp file if created
      if (tempFilePath) {
        try {
          await fs.promises.unlink(tempFilePath);
        } catch (e) {
          // ignore cleanup errors
        }
      }
    }
  }
}