from flask import jsonify, request
from firebase_admin import firestore
import firebase_admin.exceptions as firebase_exceptions
import pandas as pd
import uuid
import os

# Global variables to track indices for each user and side
# Structure: {uid: {'left': index, 'right': index}}
user_indices = {}

def get_cars_routes(app):
    """
    Get cars routes with the Flask app.
    Uses Firebase Admin SDK to get cars information.
    """
    
    def get_index(uid, side):
        """Get the current index for a user and side."""
        if uid not in user_indices:
            user_indices[uid] = {'left': 0, 'right': 1}
        return user_indices[uid][side]
    
    def set_index(uid, side, index):
        """Set the index for a user and side."""
        if uid not in user_indices:
            user_indices[uid] = {'left': 0, 'right': 1}
        user_indices[uid][side] = index
    
    def increment_index(uid, side):
        """Increment index by 2 for a user and side."""
        current = get_index(uid, side)
        set_index(uid, side, current + 2)
    
    def decrement_index(uid, side):
        """Decrement index by 2 for a user and side."""
        current = get_index(uid, side)
        new_index = current - 2
        # Ensure index doesn't go below minimum
        min_index = 0 if side == 'left' else 1
        if new_index < min_index:
            new_index = min_index
        set_index(uid, side, new_index)
    
    def reset_indices(uid):
        """Reset indices to initial values for a user."""
        user_indices[uid] = {'left': 0, 'right': 1}

    @app.route('/cars/<uid>', methods=['GET'])
    def get_cars(uid):
        """
        Get car recommendations for a user within their budget.
        For each car, calculates downpayment and stores in Firestore.

        Parameters:
            uid: The user's unique identifier

        Returns:
            JSON response with car recommendations including downpayment
        """

        try:
            # Validate UID is provided
            if not uid:
                return jsonify({
                    'error': 'Missing UID',
                    'message': 'User UID is required'
                }), 400

            # Initialize Firestore client
            db = firestore.client()
                
            # Get user document from Firestore
            user_entry = db.collection('users').document(uid).get()
            
            if not user_entry.exists:
                return jsonify({
                    'error': 'User not found',
                    'message': f'User with UID {uid} does not exist'
                }), 404
                
            user_data = user_entry.to_dict()

            # Get budget and credit_score from user data
            budget = user_data.get('budget')
            credit_score = user_data.get('credit_score')
            
            if not budget:
                return jsonify({
                    'error': 'Missing budget',
                    'message': 'User budget is required. Please update user profile first.'
                }), 400
            
            if not credit_score:
                return jsonify({
                    'error': 'Missing credit score',
                    'message': 'User credit score is required. Please update user profile first.'
                }), 400

            # Read car data from CSV
            csv_path = os.path.join(os.path.dirname(__file__), 'Toyota_price_table.csv')
            cars_df = pd.read_csv(csv_path)
            
            # Filter cars within budget
            recommended_cars = cars_df[cars_df['Entry_price'] <= budget].copy()
            
            if recommended_cars.empty:
                return jsonify({
                    'success': True,
                    'message': 'No cars found within your budget',
                    'cars': []
                }), 200

            # Process each car
            car_recommendations = []
            
            for index, car_row in recommended_cars.iterrows():
                # Create car JSON object
                car_data = {
                    'make': car_row['Maker'],
                    'model': car_row['Genmodel'],
                    'Entry_price': int(car_row['Entry_price']),
                    'year': int(car_row['Year']),
                    'image_url': car_row['Image_url']
                }
                
                # Calculate downpayment using the downpayment module
                try:
                    from downpayment import calculate_downpayment
                    
                    # Calculate downpayment using the reusable function
                    downpayment_result = calculate_downpayment(
                        car_price=car_data['Entry_price'],
                        credit_score=credit_score,
                        loan_term=36,  # Default 60 months (5 years)
                        vehicle_year=car_data['year'],
                        vehicle_model=car_data['model']
                    )
                except Exception as e:
                    # Fallback if calculation fails
                    downpayment_result = {
                        'down_payment': car_data['Entry_price'] * 0.10,
                        'total_rate': 0.0
                    }
                
                # Add downpayment to car data
                car_data['down_payment'] = downpayment_result.get('down_payment', 0)
                car_data['down_payment_rate'] = downpayment_result.get('total_rate', 10.0)
                
                # Generate unique ID for this car recommendation
                car_id = str(uuid.uuid4())
                car_data['car_id'] = car_id
                
                # Store in Firestore under user_cars collection
                # Structure: user_cars/{uid}/cars/{car_id}
                car_ref = db.collection('user_cars').document(uid).collection('cars').document(car_id)
                car_ref.set(car_data)
                
                car_recommendations.append(car_data)

            # Reset indices when new cars are generated
            reset_indices(uid)

            # Return car recommendations
            return jsonify({
                'success': True,
                'message': f'Found {len(car_recommendations)} cars within your budget',
                'cars': car_recommendations,
                'count': len(car_recommendations)
            }), 200
            
        except FileNotFoundError:
            return jsonify({
                'error': 'File not found',
                'message': 'Toyota_price_table.csv not found'
            }), 500
            
        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500

    @app.route('/cars/<uid>/next', methods=['GET'])
    def get_next_car(uid):
        """
        Get the next car recommendation for a user (increments by 2).
        Supports left and right sides with even/odd indices.

        Parameters:
            uid: The user's unique identifier
            side: Query parameter - 'left' (even indices) or 'right' (odd indices)

        Returns:
            JSON response with the next car object
        """
        try:
            # Validate UID
            if not uid:
                return jsonify({
                    'error': 'Missing UID',
                    'message': 'User UID is required'
                }), 400

            # Get side parameter (left or right)
            side = request.args.get('side', 'left').lower()
            if side not in ['left', 'right']:
                return jsonify({
                    'error': 'Invalid side',
                    'message': "Side must be 'left' or 'right'"
                }), 400

            # Initialize Firestore client
            db = firestore.client()

            # Get all cars for this user
            cars_ref = db.collection('user_cars').document(uid).collection('cars')
            cars_docs = cars_ref.get()

            if not cars_docs:
                return jsonify({
                    'error': 'No cars found',
                    'message': 'No car recommendations found. Please call /cars/<uid> first to generate recommendations.'
                }), 404

            # Convert to list and sort by Entry_price (descending)
            cars_list = []
            for doc in cars_docs:
                car_data = doc.to_dict()
                cars_list.append(car_data)
            
            # Sort by Entry_price descending
            cars_list.sort(key=lambda x: x.get('Entry_price', 0), reverse=True)

            # Get current index from global variable
            current_index = get_index(uid, side)

            # Calculate next index (increment by 2)
            next_index = current_index + 2
            
            # Determine max index based on side
            # Left side uses even indices: 0, 2, 4, 6...
            # Right side uses odd indices: 1, 3, 5, 7...
            if side == 'left':
                # Find the largest even index <= len(cars_list) - 1
                max_index = len(cars_list) - 1
                if max_index % 2 != 0:  # If max is odd, use the previous even
                    max_index = max_index - 1
                # Ensure we stay on even indices and don't exceed max
                if next_index > max_index:
                    next_index = max_index
            else:  # right side
                # Find the largest odd index <= len(cars_list) - 1
                max_index = len(cars_list) - 1
                if max_index % 2 == 0:  # If max is even, use the previous odd
                    max_index = max_index - 1
                # Ensure we stay on odd indices and don't exceed max
                if next_index > max_index:
                    next_index = max_index

            # Check if we've reached the end
            if next_index >= len(cars_list) or (side == 'left' and next_index % 2 != 0) or (side == 'right' and next_index % 2 == 0):
                return jsonify({
                    'error': 'End of list',
                    'message': f'Reached the end of {side} side recommendations',
                    'car': cars_list[current_index] if current_index < len(cars_list) else None,
                    'index': current_index
                }), 200

            # Get the car at the next index
            car = cars_list[next_index]

            # Update global index
            set_index(uid, side, next_index)

            return jsonify({
                'success': True,
                'side': side,
                'index': next_index,
                'car': car
            }), 200

        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500

    @app.route('/cars/<uid>/prev', methods=['GET'])
    def get_prev_car(uid):
        """
        Get the previous car recommendation for a user (decrements by 2).
        Supports left and right sides with even/odd indices.

        Parameters:
            uid: The user's unique identifier
            side: Query parameter - 'left' (even indices) or 'right' (odd indices)

        Returns:
            JSON response with the previous car object
        """
        try:
            # Validate UID
            if not uid:
                return jsonify({
                    'error': 'Missing UID',
                    'message': 'User UID is required'
                }), 400

            # Get side parameter (left or right)
            side = request.args.get('side', 'left').lower()
            if side not in ['left', 'right']:
                return jsonify({
                    'error': 'Invalid side',
                    'message': "Side must be 'left' or 'right'"
                }), 400

            # Initialize Firestore client
            db = firestore.client()

            # Get all cars for this user
            cars_ref = db.collection('user_cars').document(uid).collection('cars')
            cars_docs = cars_ref.get()

            if not cars_docs:
                return jsonify({
                    'error': 'No cars found',
                    'message': 'No car recommendations found. Please call /cars/<uid> first to generate recommendations.'
                }), 404

            # Convert to list and sort by Entry_price (descending)
            cars_list = []
            for doc in cars_docs:
                car_data = doc.to_dict()
                cars_list.append(car_data)
            
            # Sort by Entry_price descending
            cars_list.sort(key=lambda x: x.get('Entry_price', 0), reverse=True)

            # Get current index from global variable
            current_index = get_index(uid, side)

            # Calculate previous index (decrement by 2)
            prev_index = current_index - 2

            # Determine min index based on side
            # Left side uses even indices: 0, 2, 4, 6...
            # Right side uses odd indices: 1, 3, 5, 7...
            if side == 'left':
                min_index = 0
                # Ensure we stay on even indices
                if prev_index < min_index:
                    prev_index = min_index
            else:  # right side
                min_index = 1
                # Ensure we stay on odd indices
                if prev_index < min_index:
                    prev_index = min_index

            # Check if we've reached the beginning
            if prev_index < 0:
                return jsonify({
                    'error': 'At beginning',
                    'message': f'Already at the beginning of {side} side recommendations',
                    'car': cars_list[current_index] if current_index < len(cars_list) else None,
                    'index': current_index
                }), 200

            # Get the car at the previous index
            car = cars_list[prev_index]

            # Update global index
            set_index(uid, side, prev_index)

            return jsonify({
                'success': True,
                'side': side,
                'index': prev_index,
                'car': car
            }), 200

        except Exception as e:
            return jsonify({
                'error': 'Server error',
                'message': f'An unexpected error occurred: {str(e)}'
            }), 500