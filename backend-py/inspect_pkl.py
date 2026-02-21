import pickle
import pandas as pd
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
try:
    with open(os.path.join(BASE_DIR, "preprocessor.pkl"), "rb") as f:
        preprocessor = pickle.load(f)
    
    print("Preprocessor Type:", type(preprocessor))
    
    if hasattr(preprocessor, 'transformers_'):
        for name, transformer, columns in preprocessor.transformers_:
            print(f"\nTransformer: {name}")
            print(f"Columns: {columns}")
            if hasattr(transformer, 'categories_'):
                print(f"Categories sample: {transformer.categories_[0][:10]}")
    
    # If it was trained on a DF, it might have feature names
    if hasattr(preprocessor, 'get_feature_names_out'):
        print("\nFeature names out:", preprocessor.get_feature_names_out())
        
except Exception as e:
    print(f"Error: {e}")
