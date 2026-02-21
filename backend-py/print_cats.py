import pickle
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(BASE_DIR, "preprocessor.pkl"), "rb") as f:
    preprocessor = pickle.load(f)

for name, transformer, columns in preprocessor.transformers_:
    if name == 'StandardScaler' or name == 'remainder': continue
    if hasattr(transformer, 'categories_'):
        print(f"Categories for {name} (columns {columns}):")
        for i, cats in enumerate(transformer.categories_):
            print(f"  Category group {i}: {cats[:20]} ...")
