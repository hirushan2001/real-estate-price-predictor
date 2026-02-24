import os
import sys
sys.modules['_wmi'] = None

from flask import Flask, request, jsonify
from flask_cors import CORS
from catboost import CatBoostRegressor
import pandas as pd
import shap
import numpy as np

app = Flask(__name__)
CORS(app)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'catboost_land_model.cbm')
DATA_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'cleaned_land_data1.csv')

# Load the model
try:
    model = CatBoostRegressor()
    model.load_model(MODEL_PATH)
    print("Model loaded successfully.")
    
    # Initialize SHAP explainer
    explainer = shap.TreeExplainer(model)
    print("SHAP explainer initialized.")
except Exception as e:
    print(f"Error loading model or SHAP: {e}")
    model = None
    explainer = None

# Extract District and City mappings
location_mapping = {}
try:
    df = pd.read_csv(DATA_PATH)
    # Extract unique combinations of District and City
    grouped = df.groupby('District')['City'].unique()
    for district, cities in grouped.items():
        location_mapping[str(district)] = sorted([str(city) for city in cities])
    print("Location mapping loaded successfully.")
except Exception as e:
    print(f"Error loading location data: {e}")

@app.route('/api/locations', methods=['GET'])
def get_locations():
    """Returns a dictionary of Districts mapped to a list of available Cities"""
    if not location_mapping:
        return jsonify({"error": "Location data not available"}), 500
    return jsonify(location_mapping)

@app.route('/api/predict', methods=['POST'])
def predict():
    """Predicts the land price per perch and total price, and returns local XAI values"""
    if model is None or explainer is None:
        return jsonify({"error": "Model or Explainer not loaded"}), 500
        
    try:
        data = request.json
        district = data.get('district')
        city = data.get('city')
        land_size = float(data.get('land_size', 10))
        has_electricity = int(data.get('has_electricity', 0))
        has_water = int(data.get('has_water', 0))
        
        if not district or not city:
            return jsonify({"error": "District and City are required"}), 400

        # Construct DataFrame in the identical format as training
        input_data = pd.DataFrame([{
            'District': district,
            'City': city,
            'Land size': land_size,
            'Availability of electricity': has_electricity,
            'Availability of tap water': has_water
        }])
        
        # Predict price per perch
        price_per_perch = float(model.predict(input_data)[0])
        total_price = price_per_perch * land_size
        
        # Calculate SHAP values
        shap_values = explainer.shap_values(input_data)
        
        # Determine base value format safely
        expected_value = explainer.expected_value
        base_value = float(expected_value[0] if isinstance(expected_value, (list, np.ndarray)) else expected_value)

        # Feature contributions array
        # Features: 'District', 'City', 'Land size', 'Availability of electricity', 'Availability of tap water'
        feature_contributions = {
            "District": float(shap_values[0][0]),
            "City": float(shap_values[0][1]),
            "Land Size": float(shap_values[0][2]),
            "Electricity": float(shap_values[0][3]),
            "Tap Water": float(shap_values[0][4])
        }
        
        return jsonify({
            "price_per_perch": price_per_perch,
            "total_price": total_price,
            "land_size": land_size,
            "xai": {
                "base_value": base_value,
                "contributions": feature_contributions
            }
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    # Run the server on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
