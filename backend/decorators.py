from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            role = claims.get("role")

            if role != "admin":
                return jsonify({"error": "Admin access only"}), 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper
