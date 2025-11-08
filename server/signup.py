from flask import jsonify, request
from firebase_admin import auth
import firebase_admin.exceptions as firebase_exceptions
import requests
import os

def register_signup_routes(app):
    """
    Register signup routes with the Flask app.
    Uses Firebase Admin SDK to create users.
    """
    
    @app.route('/signup', methods=['POST'])
    def signup():
        """
        Create a new user account using Firebase Admin SDK
        ---
        tags:
          - Authentication
        parameters:
          - in: body
            name: body
            required: true
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                  example: "user@example.com"
                password:
                  type: string
                  minLength: 6
                  example: "password123"
                firstName:
                  type: string
                  example: "John"
                lastName:
                  type: string
                  example: "Doe"
                displayName:
                  type: string
                  example: "John Doe"
        responses:
          201:
            description: User created successfully
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "User created successfully"
                user:
                  type: object
                  properties:
                    uid:
                      type: string
                    email:
                      type: string
                    displayName:
                      type: string
          400:
            description: Bad request (missing/invalid data)
            schema:
              type: object
              properties:
                error:
                  type: string
                message:
                  type: string
          409:
            description: User already exists
            schema:
              type: object
              properties:
                error:
                  type: string
                  example: "User already exists"
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
            # Get JSON data from request
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'error': 'No data provided',
                    'message': 'Request body must contain JSON data'
                }), 400
            
            # Extract email, password, firstName, lastName, and displayName
            email = data.get('email')
            password = data.get('password')
            first_name = data.get('firstName')
            last_name = data.get('lastName')
            display_name = data.get('displayName')
            
            # Generate displayName from firstName and lastName if not provided
            if not display_name and first_name and last_name:
                display_name = f"{first_name} {last_name}"
            elif not display_name and first_name:
                display_name = first_name
            elif not display_name and last_name:
                display_name = last_name
            
            # Validate required fields
            if not email:
                return jsonify({
                    'error': 'Missing email',
                    'message': 'Email is required'
                }), 400
            
            if not password:
                return jsonify({
                    'error': 'Missing password',
                    'message': 'Password is required'
                }), 400
            
            # Validate password length (Firebase requires at least 6 characters)
            if len(password) < 6:
                return jsonify({
                    'error': 'Invalid password',
                    'message': 'Password must be at least 6 characters long'
                }), 400
            
            # Validate email format (basic check)
            if '@' not in email or '.' not in email.split('@')[1]:
                return jsonify({
                    'error': 'Invalid email',
                    'message': 'Please provide a valid email address'
                }), 400
            
            # Create user with Firebase Admin SDK
            try:
                user_record = auth.create_user(
                    email=email,
                    password=password,
                    display_name=display_name if display_name else None,
                )
                
                # Return success response
                return jsonify({
                    'success': True,
                    'message': 'User created successfully',
                    'user': {
                        'uid': user_record.uid,
                        'email': user_record.email,
                        'displayName': user_record.display_name,
                    }
                }), 201
                
            except firebase_exceptions.AlreadyExistsError:
                return jsonify({
                    'error': 'User already exists',
                    'message': 'An account with this email already exists'
                }), 409
                
            except firebase_exceptions.InvalidArgumentError as e:
                return jsonify({
                    'error': 'Invalid argument',
                    'message': str(e)
                }), 400
                
            except Exception as e:
                return jsonify({
                    'error': 'Firebase error',
                    'message': f'Failed to create user: {str(e)}'
                }), 500
                
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500

    @app.route('/login', methods=['POST'])
    def login():
        """
        Verify user credentials and return user info
        ---
        tags:
          - Authentication
        parameters:
          - in: body
            name: body
            required: true
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                  example: "user@example.com"
                password:
                  type: string
                  example: "password123"
        responses:
          200:
            description: Login successful
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: "Login successful"
                user:
                  type: object
                  properties:
                    uid:
                      type: string
                    email:
                      type: string
          400:
            description: Bad request (missing data)
            schema:
              type: object
              properties:
                error:
                  type: string
                message:
                  type: string
          401:
            description: Invalid credentials
            schema:
              type: object
              properties:
                error:
                  type: string
                  example: "Invalid credentials"
                message:
                  type: string
                  example: "Invalid email or password"
          404:
            description: User not found
            schema:
              type: object
              properties:
                error:
                  type: string
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
            # Get JSON data from request
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'error': 'No data provided',
                    'message': 'Request body must contain JSON data'
                }), 400
            
            # Extract email and password
            email = data.get('email')
            password = data.get('password')
            
            print(f"email: {email}")
            print(f"password: {password}")
            
            # Validate required fields
            if not email:
                return jsonify({
                    'error': 'Missing email',
                    'message': 'Email is required'
                }), 400
            
            if not password:
                return jsonify({
                    'error': 'Missing password',
                    'message': 'Password is required'
                }), 400
            
            # Get Firebase API key from environment
            api_key = os.getenv('FIREBASE_API_KEY')
            print(f"FIREBASE_API_KEY: {api_key}")
            if not api_key:
                return jsonify({
                    'error': 'Server configuration error',
                    'message': 'Firebase API key not configured'
                }), 500
            
            # Verify credentials using Firebase REST API
            try:
                # Firebase Identity Platform REST API endpoint
                verify_password_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
                
                response = requests.post(
                    verify_password_url,
                    json={
                        'email': email,
                        'password': password,
                        'returnSecureToken': True
                    }
                )
                
                if response.status_code == 200:
                    # Credentials are valid, get user info
                    firebase_response = response.json()
                    uid = firebase_response.get('localId')
                    
                    # Get user record from Admin SDK
                    try:
                        user_record = auth.get_user(uid)
                        
                        # Return success response (client will authenticate directly with Firebase SDK)
                        return jsonify({
                            'success': True,
                            'message': 'Login successful',
                            'user': {
                                'uid': user_record.uid,
                                'email': user_record.email,
                                # 'emailVerified': user_record.email_verified
                            }
                        }), 200
                        
                    except firebase_exceptions.NotFoundError:
                        return jsonify({
                            'error': 'User not found',
                            'message': 'User account does not exist'
                        }), 404
                        
                elif response.status_code == 400:
                    error_data = response.json()
                    error_message = error_data.get('error', {}).get('message', 'Invalid credentials')
                    
                    if 'INVALID_PASSWORD' in error_message or 'EMAIL_NOT_FOUND' in error_message:
                        return jsonify({
                            'error': 'Invalid credentials',
                            'message': 'Invalid email or password'
                        }), 401
                    else:
                        return jsonify({
                            'error': 'Authentication failed',
                            'message': error_message
                        }), 401
                else:
                    return jsonify({
                        'error': 'Authentication failed',
                        'message': 'Failed to verify credentials'
                    }), 401
                    
            except requests.RequestException as e:
                return jsonify({
                    'error': 'Authentication service error',
                    'message': f'Failed to connect to authentication service: {str(e)}'
                }), 500
                
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500
