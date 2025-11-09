from flask import jsonify, request

TOYOTA_MODEL_CATEGORY = {
    "camry": "Sedan",
    "corolla": "Sedan",
    "prius": "Sedan",
    "prius prime": "Sedan",
    "mirai": "Sedan",
    "avalon": "Luxury",
    "crown": "Luxury",
    "century": "Luxury",
    "rav4": "SUV",
    "rav4 hybrid": "SUV",
    "rav4 prime": "SUV",
    "highlander": "SUV",
    "grand highlander": "SUV",
    "4runner": "SUV",
    "venza": "SUV",
    "land cruiser": "SUV",
    "sequoia": "SUV",
    "sienna": "SUV",
    "corolla cross": "SUV",
    "bz4x": "SUV",
    "tacoma": "Truck",
    "tundra": "Truck",
    "gr86": "Sports",
    "gr 86": "Sports",
    "supra": "Sports",
    "gr supra": "Sports",
    "gr corolla": "Sports"
}


def _normalize_model_name(name: str) -> str:
    sanitized = "".join(ch if ch.isalnum() or ch.isspace() else " " for ch in name.lower())
    return " ".join(sanitized.split())


def map_toyota_model_to_type(vehicle_model: str, fallback: str = "Sedan") -> str:
    if not vehicle_model:
        return fallback
    normalized = _normalize_model_name(vehicle_model)
    if normalized in TOYOTA_MODEL_CATEGORY:
        return TOYOTA_MODEL_CATEGORY[normalized]
    for key, category in TOYOTA_MODEL_CATEGORY.items():
        if normalized.startswith(key):
            return category
    return fallback


def downpayment_routes(app):

    @app.route('/downpayments', methods=['GET', 'POST'])
    def estimate_down_payment():
        """
        Estimate realistic down payment for a car purchase.
        Based on car price, credit score, loan term (months), vehicle type, and year.
        """

        payload = request.args if request.method == "GET" else (request.get_json() or {})
        current_year = 2025

        car_price = float(payload.get("car_price") or 0)
        print(f"Car price: {car_price}")
        credit_score = int(payload.get("credit_score") or 0)
        print(f"Credit score: {credit_score}")
        loan_term = int(payload.get("loan_term") or 0)
        vehicle_year = int(payload.get("vehicle_year") or current_year)
        provided_vehicle_type = payload.get("vehicle_type")
        vehicle_model = payload.get("vehicle_model")

        vehicle_type = (provided_vehicle_type or "").strip().title()
        if not vehicle_type:
            vehicle_type = map_toyota_model_to_type(vehicle_model)

        base_rate = 0.10  # 10% base down payment

        # --- Credit score adjustment ---
        if credit_score >= 750:
            credit_adj = -0.02  # very good credit → lower DP
        elif credit_score >= 700:
            credit_adj = 0.00   # good credit → base
        elif credit_score >= 650:
            credit_adj = 0.03   # fair credit → +3%
        else:
            credit_adj = 0.07   # poor credit → +7%

        # --- Loan term adjustment ---
        if loan_term <= 24:
            term_adj = -0.01
        elif loan_term <= 36:
            term_adj = 0.00
        elif loan_term <= 48:
            term_adj = 0.02
        else:
            term_adj = 0.04

        # --- Vehicle type adjustment ---
        type_adj_map = {
            "Sedan": 0.00,
            "SUV": 0.02,
            "Truck": 0.03,
            "Luxury": 0.05,
            "Sports": 0.07,
        }
        type_adj = type_adj_map.get(vehicle_type, 0.00)

        # --- Vehicle age adjustment ---
        age = current_year - vehicle_year
        if age <= 1:
            age_adj = 0.02  # new car → slightly higher DP
        elif age <= 5:
            age_adj = 0.00  # normal depreciation
        else:
            age_adj = -0.02  # older car → lower DP

        # --- Combine adjustments ---
        total_rate = base_rate + credit_adj + term_adj + type_adj + age_adj

        # Clamp within realistic bounds (5%–30%)
        total_rate = max(0.05, min(total_rate, 0.30))

        # --- Compute down payment ---
        down_payment = car_price * total_rate
        return jsonify({
            "down_payment": round(down_payment, 7),
            "total_rate": round(total_rate * 100, 1)
        })
        


    # def estimate_apr(credit_score, loan_term, vehicle_year, vehicle_type, down_payment_rate):
    #     """
    #     Estimate realistic APR for a car loan based on credit risk and loan conditions.
    #     Returns annual percentage rate (APR) as a float (e.g., 6.5 for 6.5%).
    #     """

    #     current_year = 2025

    #     # --- Base APR (average market) ---
    #     base_apr = 6.0  # around 6% average in current market

    #     # --- Credit score adjustment ---
    #     if credit_score >= 750:
    #         credit_adj = -2.0
    #     elif credit_score >= 700:
    #         credit_adj = -1.0
    #     elif credit_score >= 650:
    #         credit_adj = +1.0
    #     else:
    #         credit_adj = +3.0

    #     # --- Loan term adjustment ---
    #     if loan_term <= 24:
    #         term_adj = -0.5
    #     elif loan_term <= 36:
    #         term_adj = 0.0
    #     elif loan_term <= 48:
    #         term_adj = +0.5
    #     else:
    #         term_adj = +1.0

    #     # --- Vehicle age adjustment ---
    #     vehicle_age = current_year - vehicle_year
    #     if vehicle_age > 8:
    #         age_adj = +1.0
    #     elif vehicle_age > 3:
    #         age_adj = +0.5
    #     else:
    #         age_adj = 0.0

    #     # --- Vehicle type adjustment ---
    #     type_adj_map = {
    #         "Sedan": 0.0,
    #         "SUV": 0.3,
    #         "Truck": 0.5,
    #         "Luxury": 1.0,
    #         "Sports": 1.5,
    #     }
    #     type_adj = type_adj_map.get(vehicle_type, 0.0)

    #     # --- Down payment adjustment ---
    #     # Higher down payment reduces risk slightly
    #     if down_payment_rate >= 0.20:
    #         dp_adj = -0.5
    #     elif down_payment_rate < 0.10:
    #         dp_adj = +0.5
    #     else:
    #         dp_adj = 0.0

    #     # --- Combine all adjustments ---
    #     apr = base_apr + credit_adj + term_adj + age_adj + type_adj + dp_adj

    #     # Clamp within realistic bounds (2%–15%)
    #     apr = max(2.0, min(apr, 15.0))
    #     return round(apr, 2)