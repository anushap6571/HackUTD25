from flask import jsonify, request
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
        Get user information by UID
        ---
        tags:
          - Users
        parameters:
          - in: path
            name: uid
            type: string
            required: true
            description: The user's unique identifier
            example: "abc123xyz"
        responses:
          200:
            description: User information retrieved successfully
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                user:
                  type: object
                  properties:
                    uid:
                      type: string
                    email:
                      type: string
                    displayName:
                      type: string
                    emailVerified:
                      type: boolean
                    createdAt:
                      type: string
                      format: date-time
          400:
            description: Bad request (missing UID)
            schema:
              type: object
              properties:
                error:
                  type: string
                message:
                  type: string
          404:
            description: User not found
            schema:
              type: object
              properties:
                error:
                  type: string
                  example: "User not found"
                message:
                  type: string
          500:
            description: Server error
            schema:
              type: object
              properties:
                error:
                  type: string
                message:
                  type: string
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
    
    @app.route('/users', methods=['GET'])
    def list_users():
        """
        Get all users information
        ---
        tags:
          - Users
        responses:
          200:
            description: List of all users
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                users:
                  type: array
                  items:
                    type: object
                    properties:
                      uid:
                        type: string
                      email:
                        type: string
                      displayName:
                        type: string
                      emailVerified:
                        type: boolean
                      createdAt:
                        type: string
                        format: date-time
                count:
                  type: integer
                  example: 5
          500:
            description: Server error
            schema:
              type: object
              properties:
                error:
                  type: string
                message:
                  type: string
        """
        try:
            # Get all users from Firebase Admin SDK
            users_list = []
            for user in auth.list_users().iterate_all():
                users_list.append({
                    'uid': user.uid,
                    'email': user.email,
                    'displayName': user.display_name,
                    'emailVerified': user.email_verified,
                    'createdAt': user.user_metadata.creation_timestamp if user.user_metadata else None
                })
            
            return jsonify({
                'success': True,
                'users': users_list,
                'count': len(users_list)
            }), 200
                
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500