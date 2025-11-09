# filename: finance_ai_models.py
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, accuracy_score
import joblib

# -----------------------------
# 1. Synthetic Data Generation
# -----------------------------
np.random.seed(42)
N = 2000

data = pd.DataFrame({
    "credit_score": np.random.randint(500, 850, N),
    "loan_term": np.random.choice([24, 36, 48, 60, 72], N),
    "car_price": np.random.randint(15000, 70000, N),
    "vehicle_age": np.random.randint(0, 10, N),
    "down_payment_rate": np.random.uniform(0.05, 0.30, N)
})

# Simulate APR based on credit, term, and down payment
def estimate_apr(row):
    base = 5 + (70000 - row.car_price) / 40000
    credit_adj = (700 - row.credit_score) / 100
    term_adj = (row.loan_term - 36) / 12 * 0.3
    dp_adj = (0.20 - row.down_payment_rate) * 15
    age_adj = row.vehicle_age * 0.15
    apr = base + credit_adj + term_adj + dp_adj + age_adj
    return np.clip(apr, 2, 18)

data["apr"] = data.apply(estimate_apr, axis=1)

# Simulate default risk (higher risk for low credit, low down, high term)
risk_score = (
    (650 - data["credit_score"]) / 200 +
    (data["loan_term"] - 36) / 36 +
    (0.15 - data["down_payment_rate"]) * 4 +
    (data["vehicle_age"] / 8)
)
prob_default = 1 / (1 + np.exp(-risk_score))  # sigmoid
data["default_label"] = (prob_default > 0.5).astype(int)

# -----------------------------
# 2. Split Data
# -----------------------------
X = data[["credit_score", "loan_term", "car_price", "vehicle_age", "down_payment_rate"]]

# Regression target: APR
y_reg = data["apr"]

# Classification target: Default risk
y_cls = data["default_label"]

X_train, X_test, y_reg_train, y_reg_test = train_test_split(X, y_reg, test_size=0.2, random_state=42)
_, _, y_cls_train, y_cls_test = train_test_split(X, y_cls, test_size=0.2, random_state=42)

# -----------------------------
# 3. Train Models
# -----------------------------
apr_model = RandomForestRegressor(n_estimators=150, random_state=42)
apr_model.fit(X_train, y_reg_train)

cls_model = RandomForestClassifier(n_estimators=150, random_state=42)
cls_model.fit(X_train, y_cls_train)

# -----------------------------
# 4. Evaluate Performance
# -----------------------------
apr_pred = apr_model.predict(X_test)
cls_pred = cls_model.predict(X_test)

print(f"APR MAE: {mean_absolute_error(y_reg_test, apr_pred):.2f}")
print(f"Default Risk Accuracy: {accuracy_score(y_cls_test, cls_pred):.2f}")

# -----------------------------
# 5. Save Models
# -----------------------------
joblib.dump(apr_model, "apr_model.pkl")
joblib.dump(cls_model, "risk_model.pkl")

print("✅ Models trained and saved!")
