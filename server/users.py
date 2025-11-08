from flask import jsonify, request
from firebase_admin import auth, firestore
import firebase_admin.exceptions as firebase_exceptions

def register_users_routes(app):
    """
    Register users routes with the Flask app.
    Uses Firebase Admin SDK to get user information.
    """
    
    @app.route('/users/<uid>', methods=['POST'])
    def onboard_user(uid):
        """
        Add user information to the user record.

        URL parameter:
            uid: The user's unique identifier
            credit_score: The user's credit score
            budget: The user's budget

        Returns:
            JSON response with all users information
        """
        try:
            # Validate UID is provided
            if not uid:
                return jsonify({
                    'error': 'Missing UID',
                    'message': 'User UID is required'
                }), 400

            # Get JSON data from request
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'error': 'No data provided',
                    'message': 'Request body must contain JSON data'
                }), 400

            # Extract credit_score and budget
            credit_score = data.get('credit_score')
            budget = data.get('budget')
            
            try:
                # Verify user exists in Firebase Authentication
                user_record = auth.get_user(uid)
                
                # Initialize Firestore client
                db = firestore.client()
                
                # Store custom fields in Firestore (not in Firebase Auth)
                # Create/update user document in Firestore
                user_ref = db.collection('users').document(uid).set({
                    'credit_score': credit_score,
                    'budget': budget,
                    'email': user_record.email,
                    'displayName': user_record.display_name,
                    'updatedAt': user_record.user_metadata.creation_timestamp if user_record.user_metadata else None
                }, merge=True)

                return jsonify({
                    'success': True,
                    'message': 'User updated successfully',
                    'user': {
                        'uid': uid,
                        'credit_score': credit_score,
                        'budget': budget
                    }
                }), 200

            except firebase_exceptions.NotFoundError:
                return jsonify({
                    'error': 'User not found',
                    'message': f'User with UID {uid} does not exist'
                }), 404
                
            except Exception as e:
                return jsonify({
                    'error': 'Firebase error',
                    'message': f'Failed to update user: {str(e)}'
                }), 500
                
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500

def get_users_routes(app):
    """
    Uses Firebase Admin SDK to get user information.

    Users unique identifier: UID
    """

    @app.route('/users/<uid>', methods=['GET'])
    def get_user(uid):
        """
        Get user information by UID, including display name.
        
        URL parameter:
            uid: The user's unique identifier
        
        Returns:
            JSON response with user information including displayName
        """
        try:
            # Validate UID is provided
            if not uid:
                return jsonify({
                    'error': 'Missing UID',
                    'message': 'User UID is required'
                }), 400
            
            # Get user record from Firebase Admin SDK
            try:
                user_record = auth.get_user(uid)
                
                # Get custom fields from Firestore
                db = firestore.client()
                user_doc = db.collection('users').document(uid).get()
                
                # Combine Firebase Auth data with Firestore data
                user_data = {
                    'uid': user_record.uid,
                    'email': user_record.email,
                    'displayName': user_record.display_name,
                    'emailVerified': user_record.email_verified,
                    'createdAt': user_record.user_metadata.creation_timestamp if user_record.user_metadata else None
                }
                
                # Add Firestore data if document exists
                if user_doc.exists:
                    firestore_data = user_doc.to_dict()
                    user_data['credit_score'] = firestore_data.get('credit_score')
                    user_data['budget'] = firestore_data.get('budget')
                
                # Return user information
                return jsonify({
                    'success': True,
                    'user': user_data
                }), 200
                
            except firebase_exceptions.NotFoundError:
                return jsonify({
                    'error': 'User not found',
                    'message': f'User with UID {uid} does not exist'
                }), 404
                
            except Exception as e:
                return jsonify({
                    'error': 'Firebase error',
                    'message': f'Failed to get user: {str(e)}'
                }), 500
                
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500