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

if __name__ == "__main__":
    app.run(port=5000, debug=True)
