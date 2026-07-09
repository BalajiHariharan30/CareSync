import sys
import json
import os

# Set huggingface hub offline mode if desired, or let it download
# To avoid outputting warning logs to stdout, we redirect stderr or configure logging
import logging
logging.getLogger("transformers").setLevel(logging.ERROR)

try:
    from transformers import pipeline
    from PIL import Image
except ImportError as e:
    print(json.dumps({"error": f"Import error: {str(e)}"}))
    sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
        
    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image path does not exist: {image_path}"}))
        sys.exit(1)
        
    try:
        # Load the classifier pipeline
        # nickmuchi/vit-finetuned-chest-xray-pneumonia
        model_name = "lxyuan/vit-xray-pneumonia-classification"
        classifier = pipeline("image-classification", model=model_name)
        
        # Load and convert image to RGB
        img = Image.open(image_path).convert("RGB")
        
        # Run inference
        results = classifier(img)
        
        if not results:
            print(json.dumps({"error": "Model returned no results"}))
            sys.exit(1)
            
        # Get result with highest confidence
        best_result = max(results, key=lambda x: x['score'])
        
        label = best_result['label'].upper()
        confidence = best_result['score']
        
        prediction = "Pneumonia" if "PNEUMONIA" in label else "Normal"
        
        print(json.dumps({
            "prediction": prediction,
            "confidence": round(float(confidence), 4),
            "disclaimer": "This is a proof-of-concept AI screening tool, not a clinical diagnosis. Please consult your doctor."
        }))
        sys.stdout.flush()
        sys.exit(0)
        
    except Exception as e:
        # If there's an error (e.g. offline/no internet and model not cached), we output the error
        print(json.dumps({"error": str(e)}))
        sys.stdout.flush()
        sys.exit(1)

if __name__ == "__main__":
    main()
