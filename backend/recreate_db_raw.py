import pymysql

# Config
DB_HOST = "localhost"
DB_USER = "root"
DB_PASS = "Rehan@123"
DB_NAME = "votexa"

try:
    conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS)
    cursor = conn.cursor()
    
    print(f"Dropping database {DB_NAME}...")
    cursor.execute(f"DROP DATABASE IF EXISTS {DB_NAME}")
    
    print(f"Creating database {DB_NAME}...")
    cursor.execute(f"CREATE DATABASE {DB_NAME}")
    
    print("Database recreated successfully.")
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
