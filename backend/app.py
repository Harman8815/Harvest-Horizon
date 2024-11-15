from flask import Flask, request, jsonify
import pickle
import pandas as pd
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator


with open("crop_prediction.pkl", "rb") as f:
    crop_model = pickle.load(f)

with open("yield_production.pkl", "rb") as f:
    yield_model = pickle.load(f)

# rf_model = pickle.load(open(r"RandomForest.pkl", 'rb'))
# dtr = pickle.load(open('dtr.pkl', 'rb'))
# preprocessor = pickle.load(open('preprocessor.pkl', 'rb'))

cnn = tf.keras.models.load_model('trained_model.keras')

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    try:
        input_data = pd.DataFrame([data])
        prediction = crop_model.predict(input_data)[0]
        return jsonify({"prediction": prediction})
    except Exception as e:
        return jsonify({"error": "Prediction failed"}), 500

# @app.route("/predict-yield", methods=["POST"])
# def yield_pred():
#     data = request.json
#     try:
#         input_data = pd.DataFrame([data])
#         year = data.get('year')
#         average_rain_fall_mm_per_year = data.get('average_rain_fall_mm_per_year')
#         pesticides_tonnes = data.get('pesticides_tonnes')
#         avg_temp = data.get('avg_temp')
#         area = data.get('area')
#         item = data.get('item')
#         features = np.array([[year, average_rain_fall_mm_per_year, pesticides_tonnes, avg_temp, area, item]], dtype=object)
#         transformed_features = preprocessor.transform(features)
#         prediction = dtr.predict(transformed_features).reshape(1, -1)
#         prediction = prediction[0]
#         return jsonify({"prediction": prediction})
#     except Exception as e:
#         return jsonify({"error": "Prediction failed"}), 500

@app.route("/predict-image", methods=["POST"])
def predict_image():
    try:
        # Check if 'image' is in the request files
        if 'image' not in request.files:
            return jsonify({"error": "No image file found"}), 400
        
        image_file = request.files['image']
        
        # Check if no image file is selected
        if image_file.filename == '':
            return jsonify({"error": "No selected image"}), 400
        
        # Ensure temp directory exists
        if not os.path.exists('temp'):
            os.makedirs('temp')

        # Save the image to the temp folder
        image_path = os.path.join('temp', image_file.filename)
        image_file.save(image_path)

        # Load and process the image using TensorFlow
        image = tf.keras.preprocessing.image.load_img(image_path, target_size=(128, 128))
        input_arr = tf.keras.preprocessing.image.img_to_array(image)
        input_arr = np.array([input_arr])  # Convert single image to a batch
        predictions = cnn.predict(input_arr)
        
        # Get the predicted class
        result_index = np.argmax(predictions)
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
        
        # Get the class name based on prediction index
        model_prediction = class_names[result_index]
        
        return jsonify({"prediction": model_prediction})

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
