import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Request, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from backend.config import Config
from backend.database import get_db
from backend.models import User

# --- Hashing Helpers ---
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False

# --- JWT Helpers ---
def sign_access_token(payload: dict) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + timedelta(minutes=15)
    return jwt.encode(data, Config.JWT_SECRET, algorithm="HS256")

def sign_refresh_token(payload: dict) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + timedelta(days=7)
    return jwt.encode(data, Config.JWT_REFRESH_SECRET, algorithm="HS256")

def verify_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise ValueError("Invalid access token")

def verify_refresh_token(token: str) -> dict:
    try:
        return jwt.decode(token, Config.JWT_REFRESH_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise ValueError("Invalid refresh token")

# --- Cookie Helpers ---
def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Can set to True in production
        samesite="lax",
        max_age=15 * 60,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Can set to True in production
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )

def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")

# --- Dependency Helpers ---
def get_token_from_request(request: Request) -> str | None:
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    
    # Try cookies next
    cookie_token = request.cookies.get("access_token")
    return cookie_token

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = get_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )
    
    try:
        payload = verify_access_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
        
    user = db.query(User).filter(User.id == payload.get("userId")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
        
    if user.status == "FROZEN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is frozen. Contact support."
        )
        
    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin access required"
        )
    return user
