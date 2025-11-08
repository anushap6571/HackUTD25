from flask import Flask, jsonify, request
from flasgger import Swagger

app = Flask(__name__)
swagger = Swagger(app)

@app.route('/')
def home():
    """
    Home endpoint
    ---
    tags:
      - General
    responses:
      200:
        description: Welcome message
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Hello from Flask! 🎉"
    """
    return jsonify(message="Hello from Flask! 🎉")

@app.route('/api/echo', methods=['POST'])
def echo():
    """
    Echo endpoint
    ---
    tags:
      - API
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            data:
              type: string
              example: "test data"
    responses:
      200:
        description: Returns the received data
        schema:
          type: object
          properties:
            received:
              type: object
    """
    data = request.get_json()
    return jsonify(received=data)

if __name__ == '__main__':
    app.run(debug=True)
