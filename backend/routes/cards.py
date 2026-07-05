from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from datetime import datetime
import random
import string

from backend.database import get_db
from backend.models import User, Card, Notification
from backend.schemas import CardCreate
from backend.auth import get_current_user

router = APIRouter(prefix="/cards", tags=["Cards"])

@router.get("")
def get_cards(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cards = db.query(Card).filter(Card.userId == current_user.id).order_by(Card.createdAt.desc()).all()
    return {"cards": cards}

@router.post("", status_code=201)
def issue_card(
    card_data: CardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Generate random 16 digit number in groups of 4
    groups = [str(random.randint(1000, 9999)) for _ in range(4)]
    card_number = " ".join(groups)
    
    # Expiry date
    year = datetime.now().year + random.randint(1, 5)
    month = f"{random.randint(1, 12):02d}"
    expiry = f"{month}/{str(year)[-2:]}"
    
    # CVV
    cvv = f"{random.randint(100, 999)}"
    
    card = Card(
        userId=current_user.id,
        cardNumber=card_number,
        expiry=expiry,
        cvv=cvv,
        cardType=card_data.cardType,
        status="ACTIVE"
    )
    db.add(card)
    
    notif = Notification(
        userId=current_user.id,
        title="New Card Issued",
        message=f"Your new {card_data.cardType} card ending in {card_number[-4:]} is ready to use.",
        type="SUCCESS"
    )
    db.add(notif)
    db.commit()
    db.refresh(card)
    
    return {"card": card}

@router.put("/{card_id}")
def update_card_status(
    card_id: str,
    status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    card = db.query(Card).filter(Card.id == card_id, Card.userId == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
        
    card.status = status
    
    action = "frozen" if status == "FROZEN" else "unfrozen" if status == "ACTIVE" else "cancelled"
    notif_type = "WARNING" if status == "CANCELLED" else "INFO"
    
    notif = Notification(
        userId=current_user.id,
        title=f"Card {action.capitalize()}",
        message=f"Your card ending in {card.cardNumber[-4:]} has been {action}.",
        type=notif_type
    )
    db.add(notif)
    db.commit()
    db.refresh(card)
    
    return {"card": card}
