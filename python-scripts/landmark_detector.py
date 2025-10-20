import tensorflow as tf
import tensorflow_hub as hub
import sys
import json
import requests
from PIL import Image
from io import BytesIO
import numpy as np

def load_all_landmark_models():
    """Load all available Google Landmarks models"""
    
    official_models = [
        {
            "name": "Europe",
            "model_url": "https://tfhub.dev/google/on_device_vision/classifier/landmarks_classifier_europe_V1/1",
            "labels_url": "https://www.gstatic.com/aihub/tfhub/labelmaps/landmarks_classifier_europe_V1_label_map.csv"
        },
        {
            "name": "Asia", 
            "model_url": "https://tfhub.dev/google/on_device_vision/classifier/landmarks_classifier_asia_V1/1",
            "labels_url": "https://www.gstatic.com/aihub/tfhub/labelmaps/landmarks_classifier_asia_V1_label_map.csv"
        },
        {
            "name": "North America",
            "model_url": "https://tfhub.dev/google/on_device_vision/classifier/landmarks_classifier_north_america_V1/1", 
            "labels_url": "https://www.gstatic.com/aihub/tfhub/labelmaps/landmarks_classifier_north_america_V1_label_map.csv"
        }
    ]
    
    loaded_models = []
    
    for model_config in official_models:
        try:
            print(f"🔄 Loading {model_config['name']} landmarks model...", file=sys.stderr)
            model = hub.load(model_config['model_url'])
            
            # Load official labels
            headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
            response = requests.get(model_config['labels_url'], headers=headers)
            response.raise_for_status()
            
            labels = {}
            lines = response.text.strip().split('\n')
            for line in lines[1:]:
                if ',' in line:
                    parts = line.split(',', 1)
                    if len(parts) >= 2:
                        class_id = int(parts[0])
                        landmark_name = parts[1].strip('"')
                        labels[class_id] = landmark_name
            
            loaded_models.append({
                'model': model,
                'labels': labels,
                'region': model_config['name']
            })
            print(f"✅ Loaded {model_config['name']} with {len(labels)} landmarks", file=sys.stderr)
            
        except Exception as e:
            print(f"⚠️ Failed to load {model_config['name']}: {e}", file=sys.stderr)
            continue
    
    return loaded_models

def classify_with_google_models(image_url, models):
    """Classify using Google TensorFlow Hub models"""
    google_predictions = []
    
    # Download or read and preprocess image once
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
    image_bytes = None
    try:
        # Detect local file (file:// URI or absolute path on Windows/Unix)
        if image_url.startswith('file://') or image_url.startswith('/') or (len(image_url) > 1 and image_url[1] == ':'):
            local_path = image_url.replace('file://', '')
            with open(local_path, 'rb') as f:
                image_bytes = f.read()
        else:
            response = requests.get(image_url, timeout=30, headers=headers)
            response.raise_for_status()
            image_bytes = response.content

        image = Image.open(BytesIO(image_bytes))
    except Exception as e:
        # Rethrow to let caller handle logging and fallback
        raise
    
    # Try each Google model
    for model_info in models:
        try:
            print(f"🔮 Testing Google {model_info['region']} model...", file=sys.stderr)
            
            # Preprocess for Google models (321x321)
            processed_image = image.convert('RGB').resize((321, 321))
            image_array = np.array(processed_image, dtype=np.float32) / 255.0
            image_tensor = tf.expand_dims(image_array, 0)
            
            # Get predictions
            try:
                predictions = model_info['model'](image_tensor)
            except:
                predictions = model_info['model'].signatures['default'](tf.constant(image_tensor))
            
            # Process predictions
            if isinstance(predictions, dict):
                pred_values = list(predictions.values())[0].numpy()[0]
            else:
                pred_values = predictions.numpy()[0]
            
            # Get top prediction for this model
            top_idx = np.argmax(pred_values)
            top_score = pred_values[top_idx]
            landmark_name = model_info['labels'].get(int(top_idx), f"Unknown (ID: {int(top_idx)})")
            
            google_predictions.append({
                'region': model_info['region'],
                'landmark_name': landmark_name,
                'confidence': float(top_score),
                'class_id': int(top_idx)
            })
            
            print(f"✅ Google {model_info['region']}: {landmark_name} ({top_score:.3f})", file=sys.stderr)
            
        except Exception as e:
            print(f"❌ Google {model_info['region']} failed: {e}", file=sys.stderr)
            continue
    
    return google_predictions

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Usage: python landmark_detector.py <image_url_or_local_path>"}), flush=True)
        sys.exit(1)

    image_url = sys.argv[1]
    print(f"📥 Processing image input: {image_url}", file=sys.stderr)
    
    # Initialize all_predictions list
    all_predictions = []
    
    # Test Google models only
    google_models = load_all_landmark_models()
    if google_models:
        try:
            google_predictions = classify_with_google_models(image_url, google_models)
            for pred in google_predictions:
                pred['model_type'] = 'google'
                pred['model_name'] = f"Google {pred['region']}"
                all_predictions.append(pred)
        except Exception as e:
            print(f"❌ Google models failed: {e}", file=sys.stderr)
    
    # Process predictions with confidence filtering
    if all_predictions:
        # Filter predictions with confidence >= 70%
        high_confidence_predictions = [pred for pred in all_predictions if pred['confidence'] >= 0.7]
        
        # If we have high confidence predictions, use only those
        if high_confidence_predictions:
            filtered_predictions = high_confidence_predictions
            print(f"📊 Found {len(high_confidence_predictions)} high confidence predictions (>=70%)", file=sys.stderr)
        else:
            # If no high confidence predictions, use all predictions
            filtered_predictions = all_predictions
            print(f"📊 No high confidence predictions found, showing all {len(all_predictions)} predictions", file=sys.stderr)
        
        # Sort by confidence and get only the highest one
        filtered_predictions.sort(key=lambda x: x['confidence'], reverse=True)
        best_prediction = filtered_predictions[0]
        
        result = {
            "success": True,
            "image_url": image_url,
            "best_prediction": {
                "landmark_name": best_prediction['landmark_name'],
                "confidence": best_prediction['confidence'],
                "model_type": best_prediction['model_type'],
                "model_name": best_prediction['model_name'],
                "region": best_prediction.get('region', 'Unknown'),
                "class_id": best_prediction.get('class_id')
            },
            "total_models_tested": len(google_models),
            "confidence_threshold_applied": len(high_confidence_predictions) > 0 if high_confidence_predictions else False
        }
        
        print(f"🏆 Best prediction: {best_prediction['landmark_name']} ({best_prediction['confidence']:.3f}) from {best_prediction['model_name']}", file=sys.stderr)
        
    else:
        result = {
            "success": False,
            "error": "No predictions available from any model"
        }
    
    print(json.dumps(result), flush=True)

if __name__ == "__main__":
    main()