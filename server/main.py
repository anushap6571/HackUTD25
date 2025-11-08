from flask import Flask, jsonify, request
import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv
from flasgger import Swagger
from pathlib import Path

from signup import register_signup_routes # Signup routes
from users import register_users_routes  # Add this import
from flask_cors import CORS  # Add this import

# Get the directory where this script is located
BASE_DIR = Path(__file__).parent.resolve()
ENV_PATH = BASE_DIR / '.env'

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
print("🔍 Registering signup and login routes...")
try:
    register_signup_routes(app)
    print("✅ Signup routes registered successfully")
except Exception as e:
    print(f"❌ Error registering signup routes: {e}")
    import traceback
    traceback.print_exc()

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

if __name__ == '__main__':
    app.run(debug=True)
