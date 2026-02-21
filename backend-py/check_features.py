import pickle
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(BASE_DIR, "preprocessor.pkl"), "rb") as f:
    preprocessor = pickle.load(f)

if hasattr(preprocessor, 'feature_names_in_'):
    print("Feature names in:", preprocessor.feature_names_in_)
else:
    print("No feature_names_in_ found")
