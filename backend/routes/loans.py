from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Loan, Notification
from backend.schemas import LoanCreate
from backend.auth import get_current_user

router = APIRouter(prefix="/loans", tags=["Loans"])

@router.get("")
def get_loans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    loans = db.query(Loan).filter(Loan.userId == current_user.id).order_by(Loan.createdAt.desc()).all()
    return {"loans": loans}

@router.post("", status_code=201)
def apply_loan(
    loan_data: LoanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validation constraints
    if loan_data.amount < 1000 or loan_data.amount > 100000:
        raise HTTPException(status_code=400, detail="Amount must be between $1,000 and $100,000")
        
    if loan_data.duration < 3 or loan_data.duration > 60:
        raise HTTPException(status_code=400, detail="Duration must be between 3 and 60 months")

    # Check for existing pending loan
    pending_loan = db.query(Loan).filter(
        Loan.userId == current_user.id,
        Loan.status == "PENDING"
    ).first()
    
    if pending_loan:
        raise HTTPException(status_code=409, detail="You already have a pending loan application")

    loan = Loan(
        userId=current_user.id,
        amount=loan_data.amount,
        interestRate=8.5,
        duration=loan_data.duration,
        purpose=loan_data.purpose,
        employment=loan_data.employment,
        income=loan_data.income,
        status="PENDING"
    )
    db.add(loan)
    
    notif = Notification(
        userId=current_user.id,
        title="Loan Application Submitted",
        message=f"Your loan application for ${loan_data.amount:,.2f} is under review. We'll notify you within 1-3 business days.",
        type="INFO"
    )
    db.add(notif)
    db.commit()
    db.refresh(loan)
    
    return {
        "loan": loan,
        "message": "Loan application submitted successfully"
    }
