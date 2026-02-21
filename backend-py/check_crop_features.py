import pickle
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
try:
    with open(os.path.join(BASE_DIR, "crop_prediction.pkl"), "rb") as f:
        crop_model = pickle.load(f)
    
    # Try to see feature names if it's a sklearn model
    if hasattr(crop_model, 'feature_names_in_'):
        print(f"Crop Model Features: {crop_model.feature_names_in_}")
    else:
        print("Crop model has no feature_names_in_ attribute.")
except Exception as e:
    print(f"Error: {e}")
