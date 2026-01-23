from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db, jwt

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    db.init_app(app)
    jwt.init_app(app)

    from routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from routes.elections import elections_bp
    app.register_blueprint(elections_bp, url_prefix="/api/elections")

    from routes.votes import vote_bp

    app.register_blueprint(vote_bp, url_prefix="/api")


    from routes.analytics import analytics_bp
    app.register_blueprint(analytics_bp, url_prefix="/api")

    from routes.results import results_bp
    app.register_blueprint(results_bp, url_prefix="/api")

    from routes.winner import winner_bp
    app.register_blueprint(winner_bp, url_prefix="/api")




    @app.route("/")
    def home():
        return {"message": "VOTEXA Backend Running Successfully"}

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
