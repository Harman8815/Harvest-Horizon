import sys
import json
import pickle
import numpy as np
import os

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Load the ML model
model_path = os.path.join(script_dir, 'crop_prediction.pkl')
with open(model_path, 'rb') as model_file:
    model = pickle.load(model_file)

# Get input data from command line arguments
try:
    input_data = json.loads(sys.argv[1])
except (IndexError, json.JSONDecodeError) as e:
    print("Error loading JSON data:", e)
    sys.exit(1)

input_features = np.array([
    input_data['Nitrogen'],
    input_data['P'],
    input_data['K'],
    input_data['temperature'],
    input_data['humidity'],
    input_data['ph'],
    input_data['rainfall_In_mm']
]).reshape(1, -1)  # Reshape for a single prediction

# Make prediction
prediction = model.predict(input_features)

# Output the prediction
print(prediction[0])  # Print the result
