"""
Routes for calling the auto.dev API.
No Firebase needed - just HTTP requests!

Note: You need to set AUTO_DEV_KEY in your .env file.
Get your API key from: https://www.auto.dev/
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
ENV_PATH = BASE_DIR / '.env'
load_dotenv(dotenv_path=ENV_PATH)

app = Flask(__name__)
CORS(app)

AUTO_DEV_KEY = os.getenv('AUTO_DEV_KEY')
AUTO_DEV_BASE_URL = 'https://api.auto.dev'


def make_auto_dev_request(endpoint, params=None):
    """Make authenticated request to auto.dev API"""
    # auto.dev uses query parameter authentication
    if params is None:
        params = {}
    
    # Add API key as query parameter
    params['apiKey'] = AUTO_DEV_KEY
    
    try:
        url = f'{AUTO_DEV_BASE_URL}{endpoint}'
        print(f"🔍 Making request to: {url}")
        print(f"   Params: {params}")
        
        response = requests.get(url, params=params)
        
        print(f"   Response status: {response.status_code}")
        
        response.raise_for_status()
        
        data = response.json()
        print(f"   ✅ Success!")
        return data, response.status_code
        
    except requests.exceptions.HTTPError as e:
        print(f"   ❌ HTTP Error: {e}")
        return {'error': str(e), 'details': e.response.text}, e.response.status_code
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return {'error': str(e)}, 500


# Route: Get all listings (paginated, typically 100 per page)
@app.route('/api/listings', methods=['GET'])
def get_all_listings():
    """
    Get all vehicle listings.
    Note: This returns all listings, not filtered by make/model.
    Typically returns 100 listings per page.
    """
    data, status_code = make_auto_dev_request('/listings')
    return jsonify(data), status_code


# Route: Get listing by VIN
@app.route('/api/listings/<vin>', methods=['GET'])
def get_listing_by_vin(vin):
    """Get specific vehicle listing by VIN"""
    data, status_code = make_auto_dev_request(f'/listings/{vin}')
    return jsonify(data), status_code


# Route: Get VIN information (decode VIN)
@app.route('/api/vin/<vin>', methods=['GET'])
def get_vin_info(vin):
    """Decode VIN to get vehicle information"""
    data, status_code = make_auto_dev_request(f'/vin/{vin}')
    return jsonify(data), status_code


# Route: Get vehicle specifications
@app.route('/api/specs/<vin>', methods=['GET'])
def get_specs(vin):
    """Get detailed vehicle specifications by VIN"""
    data, status_code = make_auto_dev_request(f'/specs/{vin}')
    return jsonify(data), status_code


# Route: Get vehicle photos
@app.route('/api/photos/<vin>', methods=['GET'])
def get_photos(vin):
    """Get vehicle photos by VIN"""
    data, status_code = make_auto_dev_request(f'/photos/{vin}')
    return jsonify(data), status_code


# Route: Get vehicle recalls
@app.route('/api/recalls/<vin>', methods=['GET'])
def get_recalls(vin):
    """Get vehicle recalls by VIN"""
    data, status_code = make_auto_dev_request(f'/recalls/{vin}')
    return jsonify(data), status_code


# Route: Get open recalls only
@app.route('/api/openrecalls/<vin>', methods=['GET'])
def get_open_recalls(vin):
    """Get only open/unresolved vehicle recalls by VIN"""
    data, status_code = make_auto_dev_request(f'/openrecalls/{vin}')
    return jsonify(data), status_code


# Route: Get TCO (Total Cost of Ownership)
@app.route('/api/tco/<vin>', methods=['GET'])
def get_tco(vin):
    """
    Get Total Cost of Ownership for a vehicle.
    Query params: zip (required), milesPerYear (optional)
    Example: /api/tco/WP0AF2A99KS165242?zip=90210&milesPerYear=12000
    """
    params = {}
    if request.args.get('zip'):
        params['zip'] = request.args.get('zip')
    if request.args.get('milesPerYear'):
        params['milesPerYear'] = request.args.get('milesPerYear')
    
    data, status_code = make_auto_dev_request(f'/tco/{vin}', params)
    return jsonify(data), status_code


# Route: Get taxes and fees
@app.route('/api/taxes/<vin>', methods=['GET'])
def get_taxes(vin):
    """
    Get tax and fee calculations for a vehicle purchase.
    Query params: zip (required), price (optional), docFee (optional)
    Example: /api/taxes/WP0AF2A99KS165242?zip=90210&price=50000
    """
    params = {}
    if request.args.get('zip'):
        params['zip'] = request.args.get('zip')
    if request.args.get('price'):
        params['price'] = request.args.get('price')
    if request.args.get('docFee'):
        params['docFee'] = request.args.get('docFee')
    
    data, status_code = make_auto_dev_request(f'/taxes/{vin}', params)
    return jsonify(data), status_code


# Route: License plate to VIN lookup
@app.route('/api/plate/<plate>', methods=['GET'])
def plate_to_vin(plate):
    """
    Convert license plate to VIN.
    Query params: state (required, 2-letter state code)
    Example: /api/plate/ABC1234?state=CA
    """
    params = {}
    if request.args.get('state'):
        params['state'] = request.args.get('state')
    else:
        return jsonify({'error': 'State parameter is required'}), 400
    
    data, status_code = make_auto_dev_request(f'/plate/{plate}', params)
    return jsonify(data), status_code


# Route: Search/filter listings client-side
@app.route('/api/search', methods=['POST'])
# Update the search_listings function in auto_dev_routes.py

@app.route('/api/search', methods=['POST'])
def search_listings():
    """
    Filter listings by make/model/year using auto.dev API parameters.
    
    Expected JSON body:
    {
        "make": "ford",
        "model": "mustang",
        "year": 2022
    }
    """
    try:
        search_params = request.get_json() or {}
        make = search_params.get("make", "").lower()
        model = search_params.get("model", "").lower()
        year = search_params.get("year")

        # Build query parameters for auto.dev API
        params = {}
        if make:
            params['vehicle.make'] = make
        if model:
            params['vehicle.model'] = model
        if year:
            params['vehicle.year'] = year

        # Make request to auto.dev with filters
        api_data, status_code = make_auto_dev_request('/listings', params)
        
        if status_code == 200:
            listings = api_data.get('data', [])
            return jsonify({
                "success": True,
                "listings": listings,
                "count": len(listings)
            }), 200
        else:
            return jsonify(api_data), status_code

    except Exception as e:
        return jsonify({
            "error": "Server error",
            "message": str(e)
        }), 500


# Also add a GET version for easier testing
@app.route('/api/search', methods=['GET'])
def search_listings_get():
    """
    Search listings with GET request.
    Example: /api/search?make=ford&model=mustang&year=2020
    """
    params = {}
    
    if request.args.get('make'):
        params['vehicle.make'] = request.args.get('make').lower()
    if request.args.get('model'):
        params['vehicle.model'] = request.args.get('model').lower()
    if request.args.get('year'):
        params['vehicle.year'] = request.args.get('year')
    
    data, status_code = make_auto_dev_request('/listings', params)
    return jsonify(data), status_code

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Check if API is running and configured"""
    return jsonify({
        'status': 'healthy',
        'api_key_configured': bool(AUTO_DEV_KEY)
    }), 200


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Add this route to your auto_dev_routes.py file

@app.route('/api/available', methods=['GET'])
def get_available_vehicles():
    """Get a summary of available makes and models in current listings"""
    try:
        all_listings, status_code = make_auto_dev_request('/listings')
        
        if status_code != 200:
            return jsonify(all_listings), status_code

        listings = all_listings.get('data', [])
        
        # Collect unique make/model combinations
        vehicles = {}
        for listing in listings:
            vehicle = listing.get('vehicle', {})
            make = vehicle.get('make', 'Unknown')
            model = vehicle.get('model', 'Unknown')
            year = vehicle.get('year', 'Unknown')
            
            if make not in vehicles:
                vehicles[make] = {}
            if model not in vehicles[make]:
                vehicles[make][model] = []
            if year not in vehicles[make][model]:
                vehicles[make][model].append(year)
        
        return jsonify({
            "success": True,
            "available_vehicles": vehicles,
            "total_listings": len(listings)
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Server error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    if not AUTO_DEV_KEY:
        print("⚠️  WARNING: AUTO_DEV_KEY not found in environment variables!")
        print("   Get your API key from: https://auto.dev/dashboard/api-keys")
    else:
        print(f"✅ API key loaded")
    
    print(f"\n🚀 Flask server starting on http://127.0.0.1:5001")
    print("\n📍 Available endpoints:")
    print("  GET  /health")
    print("  GET  /api/listings (all listings)")
    print("  GET  /api/listings/<vin>")
    print("  GET  /api/vin/<vin> (decode VIN)")
    print("  GET  /api/specs/<vin>")
    print("  GET  /api/photos/<vin>")
    print("  GET  /api/recalls/<vin>")
    print("  GET  /api/openrecalls/<vin>")
    print("  GET  /api/tco/<vin>?zip=90210")
    print("  GET  /api/taxes/<vin>?zip=90210&price=50000")
    print("  GET  /api/plate/<plate>?state=CA")
    print("  POST /api/search (filter listings)")
    print()
    
    app.run(debug=True, port=5001)
