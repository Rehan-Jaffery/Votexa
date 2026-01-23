import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

class Config:
    SECRET_KEY = "Rehan@123"
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:Rehan%40123@localhost:3306/votexa"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # MAIL CONFIG
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'ad.votexa@gmail.com')  # Allow env override
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')  # Will prompt user to put in .env or set here temporarily
    MAIL_DEFAULT_SENDER = 'ad.votexa@gmail.com'
