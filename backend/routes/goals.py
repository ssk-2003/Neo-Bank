from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database import get_db
from backend.models import User, Goal
from backend.schemas import GoalCreate
from backend.auth import get_current_user

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.get("")
def get_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goals = db.query(Goal).filter(Goal.userId == current_user.id).order_by(Goal.createdAt.desc()).all()
    return {"goals": goals}

@router.post("", status_code=201)
def create_goal(
    goal_data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = Goal(
        userId=current_user.id,
        name=goal_data.name,
        targetAmount=goal_data.targetAmount,
        savedAmount=0.0,
        deadline=goal_data.deadline,
        category=goal_data.category,
        status="ACTIVE"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    
    return {"goal": goal}
