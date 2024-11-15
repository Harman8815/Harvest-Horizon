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

if __name__ == "__main__":
    app.run(port=5000, debug=True)
