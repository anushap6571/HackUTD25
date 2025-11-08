from flask import Flask, jsonify, request
import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv
from flasgger import Swagger

from signup import register_signup_routes # Signup routes

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

# Register users routes
# register_users_routes(app)

if __name__ == '__main__':
    app.run(debug=True)
