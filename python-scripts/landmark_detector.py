import tensorflow as tf
import tensorflow_hub as hub
import sys
import json
import requests
from PIL import Image
from io import BytesIO
import numpy as np
import re

def get_landmark_location(landmark_name, region):
    """Extract or infer location details from landmark name"""
    # Common location patterns in landmark names
    location_info = {
        'city': None,
        'country': None,
        'region': region  # Default to model region
    }
    
    # Common landmarks with known locations (add more as needed)
    known_locations = {
        # Europe
        'eiffel tower': {'city': 'Paris', 'country': 'France', 'region': 'Europe'},
        'tour eiffel': {'city': 'Paris', 'country': 'France', 'region': 'Europe'},
        'colosseum': {'city': 'Rome', 'country': 'Italy', 'region': 'Europe'},
        'colosseo': {'city': 'Rome', 'country': 'Italy', 'region': 'Europe'},
        'big ben': {'city': 'London', 'country': 'United Kingdom', 'region': 'Europe'},
        'sagrada familia': {'city': 'Barcelona', 'country': 'Spain', 'region': 'Europe'},
        'notre-dame': {'city': 'Paris', 'country': 'France', 'region': 'Europe'},
        'louvre': {'city': 'Paris', 'country': 'France', 'region': 'Europe'},
        'brandenburg gate': {'city': 'Berlin', 'country': 'Germany', 'region': 'Europe'},
        'acropolis': {'city': 'Athens', 'country': 'Greece', 'region': 'Europe'},
        'parthenon': {'city': 'Athens', 'country': 'Greece', 'region': 'Europe'},
        'st. peter\'s basilica': {'city': 'Vatican City', 'country': 'Vatican City', 'region': 'Europe'},
        'tower bridge': {'city': 'London', 'country': 'United Kingdom', 'region': 'Europe'},
        'arc de triomphe': {'city': 'Paris', 'country': 'France', 'region': 'Europe'},
        'duomo': {'city': 'Milan', 'country': 'Italy', 'region': 'Europe'},
        'neuschwanstein castle': {'city': 'Bavaria', 'country': 'Germany', 'region': 'Europe'},
        'stonehenge': {'city': 'Wiltshire', 'country': 'United Kingdom', 'region': 'Europe'},
        'palace of versailles': {'city': 'Versailles', 'country': 'France', 'region': 'Europe'},
        'mont saint-michel': {'city': 'Normandy', 'country': 'France', 'region': 'Europe'},
        'westminster abbey': {'city': 'London', 'country': 'United Kingdom', 'region': 'Europe'},
        
        # Asia
        'taj mahal': {'city': 'Agra', 'country': 'India', 'region': 'Asia'},
        'great wall': {'city': 'Beijing', 'country': 'China', 'region': 'Asia'},
        'great wall of china': {'city': 'Beijing', 'country': 'China', 'region': 'Asia'},
        'forbidden city': {'city': 'Beijing', 'country': 'China', 'region': 'Asia'},
        'angkor wat': {'city': 'Siem Reap', 'country': 'Cambodia', 'region': 'Asia'},
        'petronas towers': {'city': 'Kuala Lumpur', 'country': 'Malaysia', 'region': 'Asia'},
        'burj khalifa': {'city': 'Dubai', 'country': 'United Arab Emirates', 'region': 'Asia'},
        'tokyo tower': {'city': 'Tokyo', 'country': 'Japan', 'region': 'Asia'},
        'mount fuji': {'city': 'Honshu', 'country': 'Japan', 'region': 'Asia'},
        'golden temple': {'city': 'Amritsar', 'country': 'India', 'region': 'Asia'},
        'petra': {'city': 'Ma\'an', 'country': 'Jordan', 'region': 'Asia'},
        'temple of heaven': {'city': 'Beijing', 'country': 'China', 'region': 'Asia'},
        'marina bay sands': {'city': 'Singapore', 'country': 'Singapore', 'region': 'Asia'},
        'batu caves': {'city': 'Kuala Lumpur', 'country': 'Malaysia', 'region': 'Asia'},
        'chand baori': {'city': 'Rajasthan', 'country': 'India', 'region': 'Asia'},
        'chand bawri': {'city': 'Rajasthan', 'country': 'India', 'region': 'Asia'},
        
        # Africa
        'pyramid of khafre': {'city': 'Giza', 'country': 'Egypt', 'region': 'Africa'},
        'pyramid of khufu': {'city': 'Giza', 'country': 'Egypt', 'region': 'Africa'},
        'great pyramid': {'city': 'Giza', 'country': 'Egypt', 'region': 'Africa'},
        'sphinx': {'city': 'Giza', 'country': 'Egypt', 'region': 'Africa'},
        'pyramids of giza': {'city': 'Giza', 'country': 'Egypt', 'region': 'Africa'},
        'egyptian pyramids': {'city': 'Giza', 'country': 'Egypt', 'region': 'Africa'},
        
        # North America
        'statue of liberty': {'city': 'New York', 'country': 'United States', 'region': 'North America'},
        'golden gate bridge': {'city': 'San Francisco', 'country': 'United States', 'region': 'North America'},
        'empire state building': {'city': 'New York', 'country': 'United States', 'region': 'North America'},
        'hollywood sign': {'city': 'Los Angeles', 'country': 'United States', 'region': 'North America'},
        'times square': {'city': 'New York', 'country': 'United States', 'region': 'North America'},
        'white house': {'city': 'Washington D.C.', 'country': 'United States', 'region': 'North America'},
        'lincoln memorial': {'city': 'Washington D.C.', 'country': 'United States', 'region': 'North America'},
        'mount rushmore': {'city': 'South Dakota', 'country': 'United States', 'region': 'North America'},
        'niagara falls': {'city': 'Ontario/New York', 'country': 'Canada/United States', 'region': 'North America'},
        'cn tower': {'city': 'Toronto', 'country': 'Canada', 'region': 'North America'},
        'space needle': {'city': 'Seattle', 'country': 'United States', 'region': 'North America'},
        'grand canyon': {'city': 'Arizona', 'country': 'United States', 'region': 'North America'},
        'brooklyn bridge': {'city': 'New York', 'country': 'United States', 'region': 'North America'},
        'alcatraz island': {'city': 'San Francisco', 'country': 'United States', 'region': 'North America'},
    }
    
    # Check if landmark is in known locations
    landmark_lower = landmark_name.lower()
    for key, loc in known_locations.items():
        if key in landmark_lower:
            location_info.update(loc)
            return location_info
    
    # Try to extract location from landmark name (e.g., "Eiffel Tower, Paris")
    # Pattern: landmark, city or landmark (city)
    city_country_pattern = r',\s*([^,]+?)(?:,\s*([^,]+))?$'
    match = re.search(city_country_pattern, landmark_name)
    if match:
        location_info['city'] = match.group(1).strip()
        if match.group(2):
            location_info['country'] = match.group(2).strip()
    
    return location_info

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

def classify_with_google_models(image_source, models, is_local_file=False):
    """Classify using Google TensorFlow Hub models"""
    google_predictions = []
    
    # Load image from URL or local file
    if is_local_file:
        # Load from local file
        try:
            image = Image.open(image_source)
        except Exception as e:
            raise Exception(f"Cannot open image file: {e}")
    else:
        # Download from URL
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
        try:
            response = requests.get(image_source, timeout=30, headers=headers)
            response.raise_for_status()
            
            # Check if content is actually an image
            content_type = response.headers.get('Content-Type', '')
            if not content_type.startswith('image/'):
                raise Exception(f"URL does not point to an image. Content-Type: {content_type}. Please use a direct image URL.")
            
            image = Image.open(BytesIO(response.content))
        except Exception as e:
            raise Exception(f"Cannot download or process image from URL: {e}")
    
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
            
            # Get location details
            location_info = get_landmark_location(landmark_name, model_info['region'])
            
            google_predictions.append({
                'region': location_info['region'],
                'landmark_name': landmark_name,
                'confidence': float(top_score),
                'class_id': int(top_idx),
                'city': location_info['city'],
                'country': location_info['country']
            })
            
            print(f"✅ Google {model_info['region']}: {landmark_name} ({top_score:.3f})", file=sys.stderr)
            
        except Exception as e:
            print(f"❌ Google {model_info['region']} failed: {e}", file=sys.stderr)
            continue
    
    return google_predictions

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Usage: python landmark_detector.py <image_url_or_path>"}))
        sys.exit(1)
    
    image_input = sys.argv[1]
    
    # Check if input is a URL or local file path
    is_local_file = not image_input.startswith(('http://', 'https://'))
    
    if is_local_file:
        print(f"📁 Loading image from local file: {image_input}", file=sys.stderr)
        # Check if file exists
        import os
        if not os.path.exists(image_input):
            print(json.dumps({"success": False, "error": f"File not found: {image_input}"}))
            sys.exit(1)
    else:
        print(f"📥 Downloading image from: {image_input}", file=sys.stderr)
    
    # Initialize all_predictions list
    all_predictions = []
    
    # Test Google models only
    google_models = load_all_landmark_models()
    if not google_models:
        print(json.dumps({
            "success": False,
            "error": "Failed to load any landmark recognition models",
            "details": "Could not load TensorFlow Hub models. Please check your internet connection."
        }))
        sys.exit(1)
    
    if google_models:
        try:
            google_predictions = classify_with_google_models(image_input, google_models, is_local_file)
            for pred in google_predictions:
                pred['model_type'] = 'google'
                pred['model_name'] = f"Google {pred['region']}"
                all_predictions.append(pred)
        except Exception as e:
            print(f"❌ Google models failed: {e}", file=sys.stderr)
            print(json.dumps({
                "success": False,
                "error": "Image processing failed",
                "details": str(e)
            }))
            sys.exit(1)
    
    # Process predictions with confidence filtering
    if all_predictions:
        # Filter predictions with confidence >= 50% (lowered threshold)
        high_confidence_predictions = [pred for pred in all_predictions if pred['confidence'] >= 0.5]
        
        # If we have high confidence predictions, use only those
        if high_confidence_predictions:
            filtered_predictions = high_confidence_predictions
            print(f"📊 Found {len(high_confidence_predictions)} high confidence predictions (>=50%)", file=sys.stderr)
        else:
            # If no high confidence predictions, use all predictions
            filtered_predictions = all_predictions
            print(f"📊 No high confidence predictions found, showing all {len(all_predictions)} predictions", file=sys.stderr)
        
        # Sort by confidence and get only the highest one
        filtered_predictions.sort(key=lambda x: x['confidence'], reverse=True)
        best_prediction = filtered_predictions[0]
        
        # Build location string
        location_parts = []
        if best_prediction.get('city'):
            location_parts.append(best_prediction['city'])
        if best_prediction.get('country'):
            location_parts.append(best_prediction['country'])
        location_parts.append(best_prediction.get('region', 'Unknown'))
        location_string = ', '.join(location_parts)
        
        result = {
            "success": True,
            "image_source": image_input,
            "is_local_file": is_local_file,
            "best_prediction": {
                "landmark_name": best_prediction['landmark_name'],
                "confidence": best_prediction['confidence'],
                "model_type": best_prediction['model_type'],
                "model_name": best_prediction['model_name'],
                "region": best_prediction.get('region', 'Unknown'),
                "city": best_prediction.get('city'),
                "country": best_prediction.get('country'),
                "location": location_string,
                "class_id": best_prediction.get('class_id')
            },
            "total_models_tested": len(google_models),
            "confidence_threshold_applied": len(high_confidence_predictions) > 0 if high_confidence_predictions else False,
            "note": "Confidence threshold: 50%"
        }
        
        print(f"🏆 Best prediction: {best_prediction['landmark_name']} ({best_prediction['confidence']:.3f}) from {best_prediction['model_name']}", file=sys.stderr)
        
    else:
        result = {
            "success": False,
            "error": "No predictions available from any model",
            "details": "This could be because: 1) The image is not a well-known landmark, 2) The image quality is poor, or 3) Model loading failed",
            "models_attempted": len(google_models)
        }
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()