from flask import Flask, request, jsonify
import pickle
import pandas as pd

# Load the model from the .pkl file
with open("crop_prediction.pkl", "rb") as f:
    model = pickle.load(f)

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    # Extract the data from the request
    data = request.json
    input_data = pd.DataFrame([data])  # Convert to DataFrame for model input

    # Predict using the model
    try:
        prediction = model.predict(input_data)[0]
        return jsonify({"prediction": prediction})
    except Exception as e:
        print("Error during prediction:", e)
        return jsonify({"error": "Prediction failed"}), 500

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Gets PORT or defaults to 5000
    app.run(host="0.0.0.0", port=port)
