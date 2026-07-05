from fastapi import APIRouter, Depends, HTTPException, Response, status, Request
from sqlalchemy.orm import Session
import re
import random
import string
from datetime import datetime

from backend.database import get_db
from backend.models import User, Account, Settings, RewardPoints, Notification
from backend.schemas import UserRegister, UserLogin, UserResponse
from backend.auth import (
    hash_password,
    verify_password,
    sign_access_token,
    sign_refresh_token,
    set_auth_cookies,
    clear_auth_cookies,
    verify_refresh_token
)

router = APIRouter(prefix="/auth", tags=["Auth"])

def validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain an uppercase letter")
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="Password must contain a number")
    if not re.search(r"[^A-Za-z0-9]", password):
        raise HTTPException(status_code=400, detail="Password must contain a special character")

def generate_referral_code(first_name: str) -> str:
    prefix = first_name.upper()[:4]
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return prefix + suffix

def generate_account_number(db: Session) -> str:
    while True:
        account_number = ''.join(random.choices(string.digits, k=10))
        # Ensure unique
        existing = db.query(Account).filter(Account.accountNumber == account_number).first()
        if not existing:
            return account_number

@router.post("/register", status_code=201)
def register(user_data: UserRegister, response: Response, db: Session = Depends(get_db)):
    # Validate password
    validate_password_strength(user_data.password)

    # Check for existing email
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Hash password
    hashed_pwd = hash_password(user_data.password)

    # Generate referral code
    ref_code = generate_referral_code(user_data.firstName)

    # Create User
    new_user = User(
        firstName=user_data.firstName,
        lastName=user_data.lastName,
        email=user_data.email,
        phone=user_data.phone,
        password=hashed_pwd,
        referralCode=ref_code,
        role="CUSTOMER",
        status="ACTIVE"
    )
    db.add(new_user)
    db.flush()  # Populates user ID

    # Create default checking account with welcome bonus
    account_number = generate_account_number(db)
    checking_account = Account(
        userId=new_user.id,
        accountNumber=account_number,
        type="CHECKING",
        balance=1000.0,  # Welcome bonus
        currency="USD",
        status="ACTIVE"
    )
    db.add(checking_account)

    # Create default settings
    default_settings = Settings(
        userId=new_user.id
    )
    db.add(default_settings)

    # Create reward points
    default_rewards = RewardPoints(
        userId=new_user.id,
        points=100,  # Welcome points
        totalEarned=100
    )
    db.add(default_rewards)

    # Create welcome notification
    welcome_notif = Notification(
        userId=new_user.id,
        title="Welcome to NeoBank! 🎉",
        message="Your account is ready. We've added a $1,000 welcome bonus to your checking account!",
        type="SUCCESS"
    )
    db.add(welcome_notif)

    # Commit all
    db.commit()
    db.refresh(new_user)

    # Tokens
    payload = {"userId": new_user.id, "email": new_user.email, "role": new_user.role}
    access_token = sign_access_token(payload)
    refresh_token = sign_refresh_token(payload)

    # Set cookies
    set_auth_cookies(response, access_token, refresh_token)

    # Return user response
    # We map UserResponse and attach accessToken in headers or custom return
    # The client handles the response: user and accessToken in body
    # Wait, the Next.js register route returns { user, accessToken, message }
    # So we should match that response format exactly!
    # Instead of response_model=UserResponse, let's return a dict.
    return {
        "user": {
            "id": new_user.id,
            "firstName": new_user.firstName,
            "lastName": new_user.lastName,
            "email": new_user.email,
            "phone": new_user.phone,
            "avatar": new_user.avatar,
            "role": new_user.role,
            "status": new_user.status
        },
        "accessToken": access_token,
        "message": "Account created successfully"
    }

@router.post("/login")
def login(login_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.status == "SUSPENDED":
        raise HTTPException(status_code=403, detail="Your account has been suspended. Contact support.")

    # Sign tokens
    payload = {"userId": user.id, "email": user.email, "role": user.role}
    access_token = sign_access_token(payload)
    refresh_token = sign_refresh_token(payload)

    # Create login notification
    login_notif = Notification(
        userId=user.id,
        title="New Login Detected",
        message=f"New login to your account on {datetime.now().strftime('%b %d, %Y')}.",
        type="INFO"
    )
    db.add(login_notif)
    db.commit()

    # Set cookies
    set_auth_cookies(response, access_token, refresh_token)

    return {
        "user": {
            "id": user.id,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "email": user.email,
            "phone": user.phone,
            "avatar": user.avatar,
            "role": user.role,
            "status": user.status
        },
        "accessToken": access_token,
        "message": "Login successful"
    }

@router.post("/refresh")
def refresh(request: Request, response: Response):
    # Try cookies or auth header
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        # Try headers
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            refresh_token = auth_header[7:]

    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")

    try:
        payload = verify_refresh_token(refresh_token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    new_payload = {"userId": payload.get("userId"), "email": payload.get("email"), "role": payload.get("role")}
    new_access_token = sign_access_token(new_payload)
    new_refresh_token = sign_refresh_token(new_payload)

    set_auth_cookies(response, new_access_token, new_refresh_token)

    return {
        "accessToken": new_access_token,
        "message": "Tokens refreshed"
    }

@router.post("/logout")
def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logout successful"}
