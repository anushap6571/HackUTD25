from flask import Flask, jsonify, request
import requests

AUTO_DEV_BASE = "https://api.auto.dev/listings"

@app.route('/api/listings', methods=['GET'])
def get_listings():
    """Fetch car listings from auto.dev"""
    make = request.args.get('make')
    model = request.args.get('model')
    year = request.args.get('year')
    zip_code = request.args.get('zip')

    if not make or not model:
        return jsonify(error="Missing parameters", message="make and model are required"), 400

    params = {'vehicle.make': make, 'vehicle.model': model}
    if year: params['vehicle.year'] = year
    if zip_code: params['zip'] = zip_code

    try:
        r = requests.get(AUTO_DEV_BASE, params=params)
        r.raise_for_status()
        data = r.json()
        return jsonify(success=True, listings=data, count=len(data) if isinstance(data, list) else 1)
    except requests.RequestException as e:
        return jsonify(error="External API error", message=str(e)), 500


@app.route('/api/listings/<listing_id>', methods=['GET'])
def get_listing_details(listing_id):
    """Fetch details for a specific listing"""
    try:
        r = requests.get(f"{AUTO_DEV_BASE}/{listing_id}")
        if r.status_code == 200:
            return jsonify(success=True, listing=r.json())
        return jsonify(error="Not found", message=f"Listing {listing_id} not found"), 404
    except Exception as e:
        return jsonify(error="Server error", message=str(e)), 500


@app.route('/api/search', methods=['POST'])
def search_listings():
    """Search listings with optional price filters"""
    data = request.get_json(force=True)
    params = {f"vehicle.{k}": v for k, v in data.items() if k in ["make", "model", "year"]}
    if "zip" in data: params["zip"] = data["zip"]

    try:
        r = requests.get(AUTO_DEV_BASE, params=params)
        r.raise_for_status()
        listings = r.json()

        # Filter by price range
        min_p, max_p = data.get("min_price"), data.get("max_price")
        if isinstance(listings, list) and (min_p or max_p):
            listings = [
                l for l in listings
                if (not min_p or l.get("price", 0) >= min_p)
                and (not max_p or l.get("price", 0) <= max_p)
            ]

        return jsonify(success=True, listings=listings, count=len(listings))
    except requests.RequestException as e:
        return jsonify(error="External API error", message=str(e)), 500


@app.route('/api/compare', methods=['GET'])
def compare_listings():
    """Compare multiple car listings"""
    make = request.args.get('make')
    model = request.args.get('model')
    if not make or not model:
        return jsonify(error="Missing parameters", message="make and model required"), 400

    try:
        r = requests.get(AUTO_DEV_BASE, params={'vehicle.make': make, 'vehicle.model': model})
        r.raise_for_status()
        listings = r.json()

        processed = [{
            'id': l.get('id'),
            'make': l.get('vehicle', {}).get('make'),
            'model': l.get('vehicle', {}).get('model'),
            'year': l.get('vehicle', {}).get('year'),
            'price': l.get('price'),
            'location': l.get('dealer', {}).get('city')
        } for l in listings]

        return jsonify(success=True, listings=processed, count=len(processed))
    except requests.RequestException as e:
        return jsonify(error="External API error", message=str(e)), 500


if __name__ == "__main__":
    app.run(debug=True)
