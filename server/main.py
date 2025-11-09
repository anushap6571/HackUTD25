from flask import Flask, jsonify, request
import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
from dotenv import load_dotenv
from flasgger import Swagger
from pathlib import Path
from downpayment import downpayment_routes

import joblib
import numpy as np
import pandas as pd
from signup import register_signup_routes # Signup routes
from flask_cors import CORS  # Add this import

# Get the directory where this script is located
BASE_DIR = Path(__file__).parent.resolve()
ENV_PATH = BASE_DIR / '.env'
from users import register_users_routes, get_users_routes # Users routes
from cars import get_cars_routes # Cars routes

# Load environment variables from .env file
# Explicitly specify the path to ensure it's found
load_dotenv(dotenv_path=ENV_PATH)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
swagger = Swagger(app)

# safety check for environment variables
def get_env(key, required=True):
    val = os.getenv(key)
    if required and not val:
        raise ValueError(f"Missing required environment variable: {key}")
    return val

# Initialize Firebase Admin SDK with service account credentials from .env
# Read individual Firebase service account fields from environment variables
firebase_cred_dict = {
    "type": get_env("FIREBASE_TYPE", required=False) or "service_account",
    "project_id": get_env("FIREBASE_PROJECT_ID"),
    "private_key_id": get_env("FIREBASE_PRIVATE_KEY_ID", required=False),
    "private_key": get_env("FIREBASE_PRIVATE_KEY").replace("\\n", "\n"),
    "client_email": get_env("FIREBASE_CLIENT_EMAIL"),
    "client_id": get_env("FIREBASE_CLIENT_ID", required=False),
    "auth_uri": get_env("FIREBASE_AUTH_URI", required=False) or "https://accounts.google.com/o/oauth2/auth",
    "token_uri": get_env("FIREBASE_TOKEN_URI", required=False) or "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": get_env("FIREBASE_AUTH_PROVIDER_X509_CERT_URL", required=False) or "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": get_env("FIREBASE_CLIENT_X509_CERT_URL", required=False),
    "universe_domain": get_env("FIREBASE_UNIVERSE_DOMAIN", required=False) or "googleapis.com"
}

# Check for required fields in firebase_cred_dict
required_fields = ['project_id', 'private_key', 'client_email']
missing_fields = [field for field in required_fields if not firebase_cred_dict.get(field)]
if missing_fields:
    print(f"\n❌ ERROR: Missing required Firebase environment variables: {', '.join(missing_fields)}")
    print(f"   Make sure your .env file exists at: {ENV_PATH}")
    raise ValueError(f"Missing required Firebase environment variables: {', '.join(missing_fields)}")

# credentials.Certificate() accepts a dictionary directly, not just JSON
cred = credentials.Certificate(firebase_cred_dict)
firebase_admin.initialize_app(cred)
print("✅ Firebase Admin SDK initialized successfully\n")
print(f"🔍 Firebase Admin project_id: {firebase_admin.get_app().project_id}\n")

# Initialize Firestore (Firebase Database)
# Firestore is automatically initialized when Firebase Admin SDK is initialized
# You can access it using: firestore.client()
db = firestore.client()

@app.route('/')
def home():
    """
    Home endpoint
    ---
    tags:
      - General
    responses:
      200:
        description: Welcome message
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Hello from Flask! 🎉"
    """
    return jsonify(message="Hello from Flask!")

@app.route('/api/echo', methods=['POST'])
def echo():
    """
    Echo endpoint
    ---
    """
    data = request.get_json()
    return jsonify(received=data)

# Register signup and login routes
print("🔍 Registering signup and login routes...")
try:
    register_signup_routes(app)
    print("✅ Signup routes registered successfully")
except Exception as e:
    print(f"❌ Error registering signup routes: {e}")
    import traceback
    traceback.print_exc()

# Register downpayment routes
downpayment_routes(app)



# Register users routes
print("🔍 Registering users routes...")
try:
    register_users_routes(app)
    print("✅ Users routes registered successfully")
except Exception as e:
    print(f"❌ Error registering users routes: {e}")
    import traceback
    traceback.print_exc()

# Print all registered routes for debugging
print("\n📋 All registered routes:")
for rule in app.url_map.iter_rules():
    methods = ', '.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
    print(f"  {methods:20} {rule.rule:30} -> {rule.endpoint}")
#register_users_routes(app)
get_users_routes(app)

# Register cars routes
get_cars_routes(app)

# ML Model Routes
# Load models
apr_model = joblib.load("apr_model.pkl")
risk_model = joblib.load("risk_model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    feature_names = [
        "credit_score",
        "loan_term",
        "car_price",
        "vehicle_age",
        "down_payment_rate"
    ]
    features_array = np.array([[
        data["credit_score"],
        data["loan_term"],
        data["car_price"],
        data["vehicle_age"],
        data["down_payment_rate"]
    ]])
    features = pd.DataFrame(features_array, columns=feature_names)

    # Predict APR and Default Risk
    apr = apr_model.predict(features)[0]
    risk = risk_model.predict_proba(features)[0][1]  # Probability of default

    # --- Calculate monthly payment ---
    car_price = float(data["car_price"])
    down_payment_rate = float(data["down_payment_rate"])
    loan_term = int(data["loan_term"])
    
    down_payment = car_price * down_payment_rate
    loan_amount = car_price - down_payment
    monthly_rate = (apr / 100) / 12

    # Avoid division by zero if rate is 0%
    if monthly_rate == 0:
        monthly_payment = loan_amount / loan_term
    else:
        monthly_payment = loan_amount * (monthly_rate * (1 + monthly_rate)**loan_term) / ((1 + monthly_rate)**loan_term - 1)

    response = {
        "predicted_apr": round(apr, 2),
        "default_risk_probability": round(risk, 3),
        "monthly_payment": round(monthly_payment, 2),
        "recommendation": "Increase down payment" if risk > 0.6 else "Good standing"
    }

    return jsonify(response)




if __name__ == '__main__':
    app.run(debug=True)
