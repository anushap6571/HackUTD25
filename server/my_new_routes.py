"""
Example template for adding new API routes to your Flask backend.

This file demonstrates the pattern used in your codebase:
1. Create a function that registers routes with the Flask app
2. Use proper error handling and JSON responses
3. Follow the same structure as existing route files

To use this:
1. Rename this file to something descriptive (e.g., 'recommendations.py', 'analytics.py')
2. Replace the example routes with your actual API endpoints
3. Import and register it in main.py
"""

from flask import jsonify, request
from firebase_admin import auth, firestore
import firebase_admin.exceptions as firebase_exceptions


def register_my_new_routes(app):
    """
    Register your new routes with the Flask app.
    
    This function follows the same pattern as:
    - register_signup_routes() in signup.py
    - register_users_routes() in users.py
    - get_cars_routes() in cars.py
    """
    
    @app.route('/api/my-endpoint', methods=['GET'])
    def my_get_endpoint():
        """
        Example GET endpoint
        
        Query parameters:
            param1: Example parameter
        
        Returns:
            JSON response with data
        """
        try:
            # Get query parameters
            param1 = request.args.get('param1')
            
            # Your logic here
            result = {
                'message': 'Success',
                'data': {
                    'param1': param1
                }
            }
            
            return jsonify(result), 200
            
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500
    
    @app.route('/api/my-endpoint', methods=['POST'])
    def my_post_endpoint():
        """
        Example POST endpoint
        
        Expected JSON payload:
        {
            "field1": "value1",
            "field2": "value2"
        }
        
        Returns:
            JSON response with created/updated data
        """
        try:
            # Get JSON data from request
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'error': 'No data provided',
                    'message': 'Request body must contain JSON data'
                }), 400
            
            # Extract fields
            field1 = data.get('field1')
            field2 = data.get('field2')
            
            # Validate required fields
            if not field1:
                return jsonify({
                    'error': 'Missing field1',
                    'message': 'field1 is required'
                }), 400
            
            # Your business logic here
            # Example: Save to Firestore
            # db = firestore.client()
            # doc_ref = db.collection('your_collection').add({
            #     'field1': field1,
            #     'field2': field2
            # })
            
            return jsonify({
                'success': True,
                'message': 'Data processed successfully',
                'data': {
                    'field1': field1,
                    'field2': field2
                }
            }), 200
            
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500
    
    @app.route('/api/my-endpoint/<id>', methods=['GET'])
    def my_get_by_id_endpoint(id):
        """
        Example GET endpoint with URL parameter
        
        URL parameter:
            id: Resource identifier
        
        Returns:
            JSON response with resource data
        """
        try:
            # Validate ID
            if not id:
                return jsonify({
                    'error': 'Missing ID',
                    'message': 'Resource ID is required'
                }), 400
            
            # Your logic here
            # Example: Get from Firestore
            # db = firestore.client()
            # doc = db.collection('your_collection').document(id).get()
            # if not doc.exists:
            #     return jsonify({
            #         'error': 'Not found',
            #         'message': f'Resource with ID {id} does not exist'
            #     }), 404
            
            return jsonify({
                'success': True,
                'data': {
                    'id': id,
                    # Add your data here
                }
            }), 200
            
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500
    
    @app.route('/api/my-endpoint/<id>', methods=['PUT'])
    def my_update_endpoint(id):
        """
        Example PUT endpoint for updating a resource
        
        URL parameter:
            id: Resource identifier
        
        Expected JSON payload:
        {
            "field1": "updated_value"
        }
        
        Returns:
            JSON response with updated data
        """
        try:
            # Validate ID
            if not id:
                return jsonify({
                    'error': 'Missing ID',
                    'message': 'Resource ID is required'
                }), 400
            
            # Get JSON data from request
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'error': 'No data provided',
                    'message': 'Request body must contain JSON data'
                }), 400
            
            # Your update logic here
            # Example: Update in Firestore
            # db = firestore.client()
            # doc_ref = db.collection('your_collection').document(id)
            # doc_ref.update(data)
            
            return jsonify({
                'success': True,
                'message': 'Resource updated successfully',
                'data': {
                    'id': id,
                    **data
                }
            }), 200
            
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500
    
    @app.route('/api/my-endpoint/<id>', methods=['DELETE'])
    def my_delete_endpoint(id):
        """
        Example DELETE endpoint
        
        URL parameter:
            id: Resource identifier
        
        Returns:
            JSON response confirming deletion
        """
        try:
            # Validate ID
            if not id:
                return jsonify({
                    'error': 'Missing ID',
                    'message': 'Resource ID is required'
                }), 400
            
            # Your delete logic here
            # Example: Delete from Firestore
            # db = firestore.client()
            # db.collection('your_collection').document(id).delete()
            
            return jsonify({
                'success': True,
                'message': f'Resource {id} deleted successfully'
            }), 200
            
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500


# Example: If you need to authenticate users before accessing routes
def register_protected_routes(app):
    """
    Example of routes that require authentication.
    You can verify the user's Firebase token here.
    """
    
    @app.route('/api/protected-endpoint', methods=['GET'])
    def protected_endpoint():
        """
        Protected endpoint that requires authentication.
        
        Headers:
            Authorization: Bearer <firebase_token>
        
        Returns:
            JSON response with user-specific data
        """
        try:
            # Get authorization header
            auth_header = request.headers.get('Authorization')
            
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({
                    'error': 'Unauthorized',
                    'message': 'Missing or invalid authorization header'
                }), 401
            
            # Extract token
            token = auth_header.split('Bearer ')[1]
            
            # Verify token (optional - you might handle this differently)
            # decoded_token = auth.verify_id_token(token)
            # uid = decoded_token['uid']
            
            # Your protected logic here
            
            return jsonify({
                'success': True,
                'message': 'Access granted',
                'data': {
                    # Your data here
                }
            }), 200
            
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500

