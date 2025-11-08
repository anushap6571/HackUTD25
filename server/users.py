from flask import jsonify
from firebase_admin import auth
import firebase_admin.exceptions as firebase_exceptions

def register_users_routes(app):
    """
    Register users routes with the Flask app.
    Uses Firebase Admin SDK to get user information.
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
                
                # Return user information
                return jsonify({
                    'success': True,
                    'user': {
                        'uid': user_record.uid,
                        'email': user_record.email,
                        'displayName': user_record.display_name,
                        'emailVerified': user_record.email_verified,
                        'createdAt': user_record.user_metadata.creation_timestamp if user_record.user_metadata else None
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
                    'message': f'Failed to get user: {str(e)}'
                }), 500
                
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500
    
    @app.route('/users', methods=['POST'])
    def onboard_user():
        """
        Get all users information.
        
        Returns:
            JSON response with all users information
        """
        try:
            # Get all users from Firebase Admin SDK
            users = auth.list_users()
            return jsonify({