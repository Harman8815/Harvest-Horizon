import pickle
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(BASE_DIR, "preprocessor.pkl"), "rb") as f:
    preprocessor = pickle.load(f)

print("Transformers list:")
for i, (name, transformer, cols) in enumerate(preprocessor.transformers_):
    print(f"Index {i}: name={name}, cols={cols}, type={type(transformer)}")
