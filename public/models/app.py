from flask import Flask, request, jsonify
import pickle
import numpy as np

app = Flask(__name__)

# Load the model
with open('crop_prediction.pkl', 'rb') as model_file:
    model = pickle.load(model_file)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    
    # Convert input data into the correct format for prediction
    features = [
        data['Nitrogen'], data['P'], data['K'],
        data['temperature'], data['humidity'],
        data['ph'], data['rainfall_In_mm']
    ]
    
    # Make prediction
    prediction = model.predict([features])[0]
    
    return jsonify({'prediction': prediction})

if __name__ == '__main__':
    app.run(debug=True)
