from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database import get_db
from backend.models import User, Budget
from backend.schemas import BudgetCreate
from backend.auth import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("")
def get_budgets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.now()
    budgets = db.query(Budget).filter(
        Budget.userId == current_user.id,
        Budget.month == now.month,
        Budget.year == now.year
    ).order_by(Budget.category.asc()).all()
    
    return {"budgets": budgets}

@router.post("", status_code=201)
def upsert_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find existing budget
    existing_budget = db.query(Budget).filter(
        Budget.userId == current_user.id,
        Budget.category == data.category,
        Budget.month == data.month,
        Budget.year == data.year
    ).first()

    if existing_budget:
        existing_budget.limit = data.limit
        db.commit()
        db.refresh(existing_budget)
        return {"budget": existing_budget}
    else:
        new_budget = Budget(
            userId=current_user.id,
            category=data.category,
            limit=data.limit,
            spent=0.0,
            month=data.month,
            year=data.year
        )
        db.add(new_budget)
        db.commit()
        db.refresh(new_budget)
        return {"budget": new_budget}
