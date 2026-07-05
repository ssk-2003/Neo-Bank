import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the root directory
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Config:
    DATABASE_URL = os.getenv("DATABASE_URL")
    # Clean up standard postgres:// to postgresql:// for SQLAlchemy
    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
    JWT_SECRET = os.getenv("JWT_SECRET", "neobank-super-secret-jwt-key-change-in-production-2024")
    JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "neobank-refresh-secret-key-change-in-production-2024")
    
    # Optional settings
    PORT = int(os.getenv("PORT", 8000))
    HOST = os.getenv("HOST", "127.0.0.1")
