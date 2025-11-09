from flask import Flask, jsonify, request
import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
from dotenv import load_dotenv
from flasgger import Swagger
from downpayment import downpayment_routes


import joblib
import numpy as np

# Routes
from signup import register_signup_routes # Signup routes
from users import register_users_routes, get_users_routes # Users routes

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
swagger = Swagger(app)

# Initialize Firebase Admin SDK with service account credentials from .env
# Read individual Firebase service account fields from environment variables
firebase_cred_dict = {
    "type": os.getenv('FIREBASE_TYPE', 'service_account'),
    "project_id": os.getenv('FIREBASE_PROJECT_ID'),
    "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
    # Convert escaped newlines (\n) to actual newlines in the private key
    "private_key": os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
    "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
    "client_id": os.getenv('FIREBASE_CLIENT_ID'),
    "auth_uri": os.getenv('FIREBASE_AUTH_URI', 'https://accounts.google.com/o/oauth2/auth'),
    "token_uri": os.getenv('FIREBASE_TOKEN_URI', 'https://oauth2.googleapis.com/token'),
    "auth_provider_x509_cert_url": os.getenv('FIREBASE_AUTH_PROVIDER_X509_CERT_URL', 'https://www.googleapis.com/oauth2/v1/certs'),
    "client_x509_cert_url": os.getenv('FIREBASE_CLIENT_X509_CERT_URL'),
    "universe_domain": os.getenv('FIREBASE_UNIVERSE_DOMAIN', 'googleapis.com')
}

# Check for required fields
required_fields = ['project_id', 'private_key', 'client_email']
missing_fields = [field for field in required_fields if not firebase_cred_dict.get(field)]
if missing_fields:
    raise ValueError(f"Missing required Firebase environment variables: {', '.join(missing_fields)}")

# credentials.Certificate() accepts a dictionary directly, not just JSON
cred = credentials.Certificate(firebase_cred_dict)
firebase_admin.initialize_app(cred)

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
    return jsonify(message="Hello from Flask! 🎉")

@app.route('/api/echo', methods=['POST'])
def echo():
    """
    Echo endpoint
    ---
    tags:
      - API
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            data:
              type: string
              example: "test data"
    responses:
      200:
        description: Returns the received data
        schema:
          type: object
          properties:
            received:
              type: object
    """
    data = request.get_json()
    return jsonify(received=data)

# Register signup and login routes
register_signup_routes(app)

# Register downpayment routes
downpayment_routes(app)



# Register users routes
# register_users_routes(app)

# ML Model Routes
# Load models
apr_model = joblib.load("apr_model.pkl")
risk_model = joblib.load("risk_model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    features = np.array([[
        data["credit_score"],
        data["loan_term"],
        data["car_price"],
        data["vehicle_age"],
        data["down_payment_rate"]
    ]])

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


# Get users routes
get_users_routes(app)

if __name__ == '__main__':
    app.run(debug=True)
