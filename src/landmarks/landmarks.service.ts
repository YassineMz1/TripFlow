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
      
      // Use Windows-compatible command
      const pythonPath = path.join(process.cwd(), 'venv', 'Scripts', 'python.exe');
      const command = `"${pythonPath}" "${this.pythonScriptPath}" "${imageUrl}"`;
      
      console.log('Executing command:', command);
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
            city: result.best_prediction.city,
            country: result.best_prediction.country,
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

  async detectLandmarkFromFile(filePath: string): Promise<any> {
    try {
      console.log(`🔍 Processing uploaded file: ${filePath}`);
      
      // Use Windows-compatible command
      const pythonPath = path.join(process.cwd(), 'venv', 'Scripts', 'python.exe');
      const command = `"${pythonPath}" "${this.pythonScriptPath}" "${filePath}"`;
      
      console.log('Executing command:', command);
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
            city: result.best_prediction.city,
            country: result.best_prediction.country,
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
      
      // Try to parse error message from Python output
      let errorMessage = 'Landmark recognition service unavailable';
      let errorDetails = error.message;
      
      if (error.stdout) {
        try {
          const pythonResult = JSON.parse(error.stdout);
          if (pythonResult.error) {
            errorMessage = pythonResult.error;
            errorDetails = pythonResult.details || pythonResult.error;
          }
        } catch (parseError) {
          // If JSON parsing fails, use original error
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        details: errorDetails,
        note: 'For URL recognition, please use direct image URLs (ending in .jpg, .png, etc.). For other images, please upload the file instead.'
      };
    }
  }
}