from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Settings
from backend.schemas import SettingsUpdate
from backend.auth import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    settings = db.query(Settings).filter(Settings.userId == current_user.id).first()
    if not settings:
        # Auto-create settings if missing
        settings = Settings(userId=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return {"settings": settings}

@router.put("")
def update_settings(
    settings_data: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    settings = db.query(Settings).filter(Settings.userId == current_user.id).first()
    
    if not settings:
        settings = Settings(userId=current_user.id)
        db.add(settings)
        db.flush()
        
    # Update fields that are provided
    for key, value in settings_data.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)
        
    db.commit()
    db.refresh(settings)
    
    return {"settings": settings}
