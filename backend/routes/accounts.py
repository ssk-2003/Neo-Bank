from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import random
import string

from backend.database import get_db
from backend.models import User, Account, Notification
from backend.schemas import AccountCreate
from backend.auth import get_current_user

router = APIRouter(prefix="/accounts", tags=["Accounts"])

def generate_account_number(db: Session) -> str:
    while True:
        account_number = ''.join(random.choices(string.digits, k=10))
        existing = db.query(Account).filter(Account.accountNumber == account_number).first()
        if not existing:
            return account_number

@router.get("")
def get_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    accounts = db.query(Account).filter(Account.userId == current_user.id).order_by(Account.createdAt.asc()).all()
    # Map to custom list output
    return {"accounts": accounts}

@router.post("", status_code=201)
def create_account(account_data: AccountCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account_number = generate_account_number(db)
    
    account = Account(
        userId=current_user.id,
        accountNumber=account_number,
        type=account_data.type,
        balance=0.0,
        currency=account_data.currency,
        status="ACTIVE"
    )
    db.add(account)
    
    # Create notification
    notif = Notification(
        userId=current_user.id,
        title="New Account Created",
        message=f"Your {account_data.type.lower()} account ending in {account_number[-4:]} has been created.",
        type="SUCCESS"
    )
    db.add(notif)
    db.commit()
    db.refresh(account)
    
    return {"account": account}
