from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
import re

from backend.database import get_db
from backend.models import User, Account, Loan, Card, Notification
from backend.auth import get_current_user, hash_password, verify_password

router = APIRouter(prefix="/user", tags=["User"])

@router.get("")
def get_user_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    accounts_count = db.query(Account).filter(Account.userId == current_user.id).count()
    loans_count = db.query(Loan).filter(Loan.userId == current_user.id).count()
    cards_count = db.query(Card).filter(Card.userId == current_user.id).count()
    
    # Structure user dict
    user_data = {
        "id": current_user.id,
        "firstName": current_user.firstName,
        "lastName": current_user.lastName,
        "email": current_user.email,
        "phone": current_user.phone,
        "avatar": current_user.avatar,
        "role": current_user.role,
        "status": current_user.status,
        "emailVerified": current_user.emailVerified,
        "twoFactorEnabled": current_user.twoFactorEnabled,
        "referralCode": current_user.referralCode,
        "referredBy": current_user.referredBy,
        "createdAt": current_user.createdAt,
        "rewardPoints": current_user.rewardPoints,
        "settings": current_user.settings,
        "_count": {
            "accounts": accounts_count,
            "loans": loans_count,
            "cards": cards_count
        }
    }
    
    return {"user": user_data}

@router.put("")
def update_user_profile(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Handle password change
    if "currentPassword" in body and "newPassword" in body:
        if not verify_password(body["currentPassword"], current_user.password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
            
        # Validate password strength
        new_pwd = body["newPassword"]
        if len(new_pwd) < 8 or not re.search(r"[A-Z]", new_pwd) or not re.search(r"[0-9]", new_pwd) or not re.search(r"[^A-Za-z0-9]", new_pwd):
            raise HTTPException(status_code=400, detail="Password is too weak")
            
        current_user.password = hash_password(new_pwd)
        
        notif = Notification(
            userId=current_user.id,
            title="Password Changed",
            message="Your password was changed successfully.",
            type="INFO"
        )
        db.add(notif)
        db.commit()
        
        return {"message": "Password updated successfully"}
        
    # Handle standard info update
    if "firstName" in body:
        current_user.firstName = body["firstName"]
    if "lastName" in body:
        current_user.lastName = body["lastName"]
    if "phone" in body:
        current_user.phone = body["phone"]
    if "avatar" in body:
        current_user.avatar = body["avatar"]
        
    db.commit()
    db.refresh(current_user)
    
    return {
        "user": {
            "id": current_user.id,
            "firstName": current_user.firstName,
            "lastName": current_user.lastName,
            "email": current_user.email,
            "phone": current_user.phone,
            "avatar": current_user.avatar,
            "role": current_user.role
        }
    }
