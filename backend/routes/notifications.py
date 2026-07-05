from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Notification
from backend.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
def get_notifications(
    unread: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Notification).filter(Notification.userId == current_user.id)
    if unread:
        query = query.filter(Notification.read == False)
        
    notifications = query.order_by(Notification.createdAt.desc()).limit(50).all()
    unread_count = db.query(Notification).filter(
        Notification.userId == current_user.id,
        Notification.read == False
    ).count()
    
    return {"notifications": notifications, "unreadCount": unread_count}

@router.put("")
def update_notifications(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    mark_all_read = payload.get("markAllRead", False)
    notification_id = payload.get("id", None)
    
    if mark_all_read:
        db.query(Notification).filter(Notification.userId == current_user.id).update({"read": True})
        db.commit()
        return {"message": "All notifications marked as read"}
        
    if notification_id:
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.userId == current_user.id
        ).first()
        
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found")
            
        notif.read = True
        db.commit()
        db.refresh(notif)
        return {"notification": notif}
        
    raise HTTPException(status_code=400, detail="Invalid request")
