from flask import Flask
from flask_cors import CORS
from .config import Config
from .extensions import db, jwt, mail

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)

    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from .routes.elections import elections_bp
    app.register_blueprint(elections_bp, url_prefix="/api/elections")

    from .routes.votes import vote_bp
    app.register_blueprint(vote_bp, url_prefix="/api/votes")
    


    from .routes.analytics import analytics_bp
    app.register_blueprint(analytics_bp, url_prefix="/api")

    from .routes.results import results_bp
    app.register_blueprint(results_bp, url_prefix="/api/results")

    from .routes.users import users_bp
    app.register_blueprint(users_bp, url_prefix="/api/users")

    from .routes.winner import winner_bp
    app.register_blueprint(winner_bp, url_prefix="/api")

    from .routes.applications import applications_bp
    app.register_blueprint(applications_bp, url_prefix="/api/applications")

    from .routes.announcements import announcement_bp
    app.register_blueprint(announcement_bp, url_prefix="/api/announcements")

    from .routes.class_stats import class_stats_bp
    app.register_blueprint(class_stats_bp, url_prefix="/api/class-stats")


    @app.route("/")
    def home():
        return {"message": "VOTEXA Backend Running Successfully"}

    return app
