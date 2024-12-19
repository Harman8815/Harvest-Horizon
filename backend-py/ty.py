from flask import Flask, jsonify
import tensorflow as tf
import os
import numpy as np
from tensorflow.keras.preprocessing.image import img_to_array, load_img
import traceback

# Initialize Flask app
app = Flask(__name__)

# Load the pre-trained model (Ensure the path is correct)
cnn = tf.keras.models.load_model(r'D:\CODING\project\Harvest Horizon\backend-py\trained_model.keras')

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

# Function to preprocess and predict from an image
def predict_image(image_path):
    try:
        # Check if image path exists
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")

        # Load and preprocess the image
        image = load_img(image_path, target_size=(128, 128))  # Resize image
        input_arr = img_to_array(image) / 255.0  # Normalize the image
        input_arr = np.expand_dims(input_arr, axis=0)  # Add batch dimension
        print(f"Image shape after preprocessing: {input_arr.shape}")  # Log the shape

        # Ensure the CNN model is loaded
        if cnn is None:
            raise ValueError("CNN model is not loaded.")
        
        # Make predictions
        predictions = cnn.predict(input_arr)
        result_index = np.argmax(predictions)

        # Map the result to the class name
        model_prediction = class_names[result_index]
        print(f"Prediction result: {model_prediction}")  # Log the prediction

        return model_prediction

    except Exception as e:
        # Log the error and send a failure response
        print(f"Error during image prediction: {str(e)}")
        print(traceback.format_exc())  # Detailed stack trace for debugging
        return {"error": "Prediction failed", "details": str(e)}

# Test the function with a hardcoded image file path
if __name__ == "__main__":
    # Provide the path to your image file for testing
    image_path = r'D:\CODING\project\Harvest Horizon\backend-py\temp\image.jpg'  # Replace with your test image path

    # Ensure image path is valid before prediction
    if os.path.exists(image_path):
        prediction_result = predict_image(image_path)
        print(f"Prediction result: {prediction_result}")
    else:
        print(f"Error: Image file not found at {image_path}")
