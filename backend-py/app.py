from flask import Flask, request, jsonify
import pickle
import pandas as pd
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import traceback

# Disable GPU for TensorFlow
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Set the base directory dynamically
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Load models using full paths
try:
    with open(os.path.join(BASE_DIR, "crop_prediction.pkl"), "rb") as f:
        crop_model = pickle.load(f)

    with open(os.path.join(BASE_DIR, "dtr.pkl"), "rb") as f:
        yield_model = pickle.load(f)
    
    with open(os.path.join(BASE_DIR, "preprocessor.pkl"), "rb") as f:
        preprocessor = pickle.load(f)

    # Load CNN model - Wrap in sub-try to allow server to start if CNN is missing
    cnn = None
    try:
        model_path = os.path.join(BASE_DIR, 'trained_model.keras')
        if os.path.exists(model_path):
            cnn = tf.keras.models.load_model(model_path)
            print("Successfully loaded CNN model.")
        else:
            print(f"Warning: {model_path} not found. Disease detection will be disabled.")
    except Exception as cnn_err:
        print(f"Error loading CNN model: {cnn_err}")

except Exception as e:
    print(f"Critical error loading primary models: {e}")
    # Don't raise, let the server try to start

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    try:
        print(f"Crop Prediction Input: {data}")
        # Explicit feature mapping to ensure correct order and types
        # Expected: N, P, K, temperature, humidity, ph, rainfall
        features = {
            'N': float(data.get('N', 0)),
            'P': float(data.get('P', 0)),
            'K': float(data.get('K', 0)),
            'temperature': float(data.get('temperature', 25.0)),
            'humidity': float(data.get('humidity', 70.0)),
            'ph': float(data.get('ph', 7.0)),
            'rainfall': float(data.get('rainfall', 100.0))
        }
        
        input_data = pd.DataFrame([features])
        prediction = crop_model.predict(input_data)[0]
        return jsonify({"prediction": prediction})
    except Exception as e:
        print(f"Error during crop prediction: {str(e)}")
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500

@app.route("/predict-yield", methods=["POST"])
def predict_yield():
    data = request.json
    try:
        # Define the exact column order expected by the preprocessor/model
        # Most yield models for this dataset expect: Item, Year, Rainfall, Pesticides, Temp
        # Note: 'Area' is often not a feature in the base dataset, or used differently.
        
        # The model expects exactly 6 features in this order:
        # ['Year', 'average_rain_fall_mm_per_year', 'pesticides_tonnes', 'avg_temp', 'Area', 'Item']
        
        features = {
            'Year': int(data.get('Year')),
            'average_rain_fall_mm_per_year': float(data.get('average_rain_fall_mm_per_year')),
            'pesticides_tonnes': float(data.get('pesticides_tonnes')),
            'avg_temp': float(data.get('avg_temp')),
            'Area': 'India', # Defaulting to India as the geographic training area
            'Item': str(data.get('Item'))
        }
        
        # Create DataFrame with explicit column sequence
        input_df = pd.DataFrame([features])
        
        # Transform and Predict
        transformed_df = preprocessor.transform(input_df)
        prediction = yield_model.predict(transformed_df)[0]
        
        return jsonify({"prediction": float(prediction)})
    except ValueError as ve:
        # Handle the specific 'unknown categories' error gracefully
        print(f"Validation Error: {str(ve)}")
        return jsonify({
            "error": "Invalid Input", 
            "details": f"The crop '{data.get('Item')}' is not in our historical yield database. Please try common crops like Wheat, Rice, or Maize."
        }), 400
    except Exception as e:
        print(f"Error during yield prediction: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500


os.makedirs('temp', exist_ok=True)

@app.route("/predict-image", methods=["POST"])
def predict_image():
    try:
        # Check for image file in the request
        if 'image' not in request.files:
            return jsonify({"error": "No image file found"}), 400

        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({"error": "No selected image"}), 400

        # Save the image to the `temp` directory
        image_path = os.path.join('temp', image_file.filename)
        image_file.save(image_path)
        print(f"Image saved to: {image_path}")  # Log the image path

        # Load and preprocess the image
        image = tf.keras.preprocessing.image.load_img(image_path, target_size=(128, 128))  # Resize image
        input_arr = tf.keras.preprocessing.image.img_to_array(image) / 255.0  # Normalize the image
        input_arr = np.expand_dims(input_arr, axis=0)  # Add batch dimension

        # Ensure CNN model is loaded
        if cnn is None:
            raise ValueError("Model is not loaded.")

        # Make predictions
        predictions = cnn.predict(input_arr)
        result_index = np.argmax(predictions)

        # Class names for the model
        class_names = [
            'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
            'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
            'Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot', 'Corn_(maize)___Common_rust_',
            'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy', 'Grape___Black_rot',
            'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
            'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy',
            'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 'Potato___Early_blight', 'Potato___Late_blight',
            'Potato___healthy', 'Raspberry___healthy', 'Soybean___healthy', 'Squash___Powdery_mildew',
            'Strawberry___Leaf_scorch', 'Strawberry___healthy', 'Tomato___Bacterial_spot', 'Tomato___Early_blight',
            'Tomato___Late_blight', 'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites_',
            'Tomato___Target_Spot', 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus',
            'Tomato___healthy'
        ]

        # Map the result to the class name
        model_prediction = class_names[result_index]
        print(f"Prediction result: {model_prediction}")  # Log the prediction

        return jsonify({"prediction": model_prediction}), 200

    except Exception as e:
        # Log the error and send a failure response
        print(f"Error during image prediction: {str(e)}")
        print(traceback.format_exc())  # Detailed stack trace for debugging
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
