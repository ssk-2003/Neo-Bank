from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime
import random
import string

from backend.database import get_db
from backend.models import User, Account, Transaction, Budget
from backend.auth import get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("")
def get_expenses(
    category: str | None = Query(None),
    month: int | None = Query(None),
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all user account IDs
    user_accounts = db.query(Account).filter(Account.userId == current_user.id).all()
    account_ids = [a.id for a in user_accounts]
    
    # Core filter: payment type, sent by this user, and in user's accounts
    base_filters = [
        Transaction.accountId.in_(account_ids),
        Transaction.type == "PAYMENT",
        Transaction.senderId == current_user.id
    ]
    
    if category:
        base_filters.append(Transaction.category == category)
        
    if month and year:
        # Range filter
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        base_filters.append(Transaction.createdAt >= start_date)
        base_filters.append(Transaction.createdAt < end_date)
        
    # Get paginated/recent expenses
    expenses = db.query(Transaction).filter(*base_filters)\
        .order_by(Transaction.createdAt.desc()).limit(100).all()
        
    # Calculate category totals
    # Query all matching payment transactions for totals calculation
    totals_filters = [
        Transaction.accountId.in_(account_ids),
        Transaction.type == "PAYMENT",
        Transaction.senderId == current_user.id
    ]
    if month and year:
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        totals_filters.append(Transaction.createdAt >= start_date)
        totals_filters.append(Transaction.createdAt < end_date)
        
    all_matching = db.query(Transaction).filter(*totals_filters).all()
    
    category_totals = {}
    total_spent = 0.0
    for e in all_matching:
        category_totals[e.category] = category_totals.get(e.category, 0.0) + e.amount
        total_spent += e.amount
        
    return {
        "expenses": expenses,
        "categoryTotals": category_totals,
        "total": total_spent
    }

@router.post("", status_code=201)
def log_expense(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    title = payload.get("title")
    amount = payload.get("amount")
    category = payload.get("category")
    date_str = payload.get("date")
    notes = payload.get("notes")
    
    if not title or not amount or not category:
        raise HTTPException(status_code=400, detail="Title, amount, and category are required")
        
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    # Get primary/first active account for user
    account = db.query(Account).filter(
        Account.userId == current_user.id,
        Account.status == "ACTIVE"
    ).order_by(Account.createdAt.asc()).first()
    
    if not account:
        raise HTTPException(status_code=400, detail="No active account found. Please create an account first.")
        
    reference = "EXP" + str(int(datetime.now().timestamp() * 1000)) + "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    
    # Parse date or default to now
    created_at = datetime.now()
    if date_str:
        try:
            created_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except ValueError:
            pass
            
    try:
        new_expense = Transaction(
            senderId=current_user.id,
            accountId=account.id,
            amount=amount,
            type="PAYMENT",
            category=category,
            description=title + (f" — {notes}" if notes else ""),
            status="COMPLETED",
            reference=reference,
            createdAt=created_at
        )
        db.add(new_expense)
        
        # Update budget spent (find matching budget for category, month, and year)
        budget = db.query(Budget).filter(
            Budget.userId == current_user.id,
            Budget.category == category,
            Budget.month == created_at.month,
            Budget.year == created_at.year
        ).first()
        
        if budget:
            budget.spent += amount
            
        db.commit()
        db.refresh(new_expense)
        
        return {
            "expense": new_expense,
            "message": "Expense logged successfully!"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to log expense: {str(e)}")

@router.delete("")
def delete_expense(
    id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify expense belongs to user accounts and is a payment
    user_accounts = db.query(Account).filter(Account.userId == current_user.id).all()
    account_ids = [a.id for a in user_accounts]
    
    expense = db.query(Transaction).filter(
        Transaction.id == id,
        Transaction.accountId.in_(account_ids),
        Transaction.type == "PAYMENT"
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    try:
        db.delete(expense)
        db.commit()
        return {"message": "Expense deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete expense: {str(e)}")
