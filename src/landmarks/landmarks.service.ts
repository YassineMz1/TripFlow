import { Injectable, OnModuleInit } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class LandmarksService implements OnModuleInit {
  private pythonScriptPath: string;

  async onModuleInit() {
    this.pythonScriptPath = path.join(process.cwd(), 'python-scripts', 'landmark_detector.py');
    console.log('✅ Landmarks service initialized with Python integration');
    console.log('📍 Python script path:', this.pythonScriptPath);
  }

  async detectLandmarkFromUrl(imageUrl: string): Promise<any> {
    try {
      console.log(`🔍 Processing image: ${imageUrl}`);
      
      // Activate venv and run Python script
      const command = `source venv/bin/activate && python3 "${this.pythonScriptPath}" "${imageUrl}"`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.log('Python stderr:', stderr);
      }
      
      console.log('Python stdout:', stdout);

      const result = JSON.parse(stdout);
      
      if (result.success && result.best_prediction) {
        return {
          success: true,
          landmark: {
            name: result.best_prediction.landmark_name,
            confidence: Math.round(result.best_prediction.confidence * 10000) / 100,
            region: result.best_prediction.region,
            model_used: result.best_prediction.model_name,
            class_id: result.best_prediction.class_id
          },
          total_models_tested: result.total_models_tested,
          confidence_threshold_applied: result.confidence_threshold_applied
        };
      } else {
        return {
          success: false,
          error: result.error || 'No landmark detected',
          note: 'Landmark recognition failed'
        };
      }
    } catch (error) {
      console.error('Python script error:', error);
      return {
        success: false,
        error: 'Landmark recognition service unavailable',
        details: error.message,
        note: 'Make sure Python dependencies are installed and virtual environment is activated'
      };
    }
  }

  async detectLandmarkFromFile(fileBuffer: Buffer): Promise<any> {
    return {
      success: false,
      error: 'File upload not implemented yet',
      note: 'Use URL endpoint for now: POST /landmarks/recognize-url with {"imageUrl": "https://..."}'
    };
  }
}