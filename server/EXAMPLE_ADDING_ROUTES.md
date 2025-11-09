# How to Add New API Routes to Your Backend

## Quick Start Guide

### Step 1: Create Your Route File
Create a new file in the `server/` directory (e.g., `my_feature.py`)

### Step 2: Follow This Pattern

```python
from flask import jsonify, request
from firebase_admin import auth, firestore
import firebase_admin.exceptions as firebase_exceptions

def register_my_feature_routes(app):
    """
    Register your routes with the Flask app.
    """
    
    @app.route('/api/my-endpoint', methods=['GET'])
    def my_endpoint():
        try:
            # Your logic here
            return jsonify({'success': True, 'data': {}}), 200
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': str(e)
            }), 500
```

### Step 3: Register in main.py

Add these lines to `main.py`:

```python
# At the top with other imports
from my_feature import register_my_feature_routes

# In the registration section (around line 130)
# Register your new routes
print("🔍 Registering my feature routes...")
try:
    register_my_feature_routes(app)
    print("✅ My feature routes registered successfully")
except Exception as e:
    print(f"❌ Error registering my feature routes: {e}")
    import traceback
    traceback.print_exc()
```

## Example: Adding a Chatbot Endpoint

### File: `server/chatbot.py`
```python
from flask import jsonify, request

def register_chatbot_routes(app):
    @app.route('/api/chatbot', methods=['POST'])
    def chatbot():
        try:
            data = request.get_json()
            prompt = data.get('prompt')
            
            if not prompt:
                return jsonify({
                    'error': 'Missing prompt',
                    'message': 'Prompt is required'
                }), 400
            
            # Your chatbot logic here
            response = f"Echo: {prompt}"
            
            return jsonify({
                'success': True,
                'response': response
            }), 200
            
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': str(e)
            }), 500
```

### In `main.py`:
```python
# Import
from chatbot import register_chatbot_routes

# Register (add after line 132)
register_chatbot_routes(app)
```

## Common Patterns

### GET with Query Parameters
```python
@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('q')
    limit = request.args.get('limit', default=10, type=int)
    # Your logic
```

### POST with JSON Body
```python
@app.route('/api/create', methods=['POST'])
def create():
    data = request.get_json()
    field1 = data.get('field1')
    # Your logic
```

### GET with URL Parameter
```python
@app.route('/api/resource/<id>', methods=['GET'])
def get_resource(id):
    # Your logic using id
```

### Using Firestore
```python
db = firestore.client()
# Create
db.collection('my_collection').add({'field': 'value'})
# Read
doc = db.collection('my_collection').document(id).get()
# Update
db.collection('my_collection').document(id).update({'field': 'new_value'})
# Delete
db.collection('my_collection').document(id).delete()
```

### Using Firebase Auth
```python
# Get user by UID
user = auth.get_user(uid)
# Verify token (if needed)
decoded_token = auth.verify_id_token(token)
```

## Error Handling Pattern

Always wrap your routes in try/except:

```python
try:
    # Your logic
    return jsonify({'success': True}), 200
except SpecificException as e:
    return jsonify({
        'error': 'Specific error',
        'message': str(e)
    }), 400
except Exception as e:
    return jsonify({
        'error': 'Server error',
        'message': str(e)
    }), 500
```

