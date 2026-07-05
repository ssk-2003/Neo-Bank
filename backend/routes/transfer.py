from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import random
import string

from backend.database import get_db
from backend.models import User, Account, Transaction, Notification, RewardPoints
from backend.auth import get_current_user
from backend.schemas import TransferRequest

router = APIRouter(prefix="/transfer", tags=["Transfer"])

@router.post("")
def transfer(
    data: TransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate sender account
    sender_account = db.query(Account).filter(
        Account.id == data.senderAccountId,
        Account.userId == current_user.id,
        Account.status == "ACTIVE"
    ).first()

    if not sender_account:
        raise HTTPException(status_code=404, detail="Sender account not found or inactive")

    # Check balance
    if sender_account.balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Self-transfer check
    if data.recipientEmail == current_user.email:
        raise HTTPException(status_code=400, detail="Cannot transfer to yourself")

    # Find receiver
    receiver = db.query(User).filter(User.email == data.recipientEmail).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Recipient not found")

    if receiver.status in ["FROZEN", "SUSPENDED"]:
        raise HTTPException(status_code=400, detail="Recipient account is unavailable")

    # Find receiver's primary CHECKING account
    receiver_account = db.query(Account).filter(
        Account.userId == receiver.id,
        Account.status == "ACTIVE",
        Account.type == "CHECKING"
    ).first()

    if not receiver_account:
        raise HTTPException(status_code=404, detail="Recipient has no active checking account")

    # Generate a unique transaction reference
    reference = "TXN" + str(int(datetime.now().timestamp() * 1000)) + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

    try:
        # Perform transfer operations
        sender_account.balance -= data.amount
        receiver_account.balance += data.amount

        # Create sender transaction record (debit)
        sender_txn = Transaction(
            senderId=current_user.id,
            receiverId=receiver.id,
            accountId=sender_account.id,
            amount=data.amount,
            type="TRANSFER",
            category=data.category,
            description=data.description or f"Transfer to {receiver.firstName} {receiver.lastName}",
            status="COMPLETED",
            reference=reference
        )
        db.add(sender_txn)

        # Create receiver transaction record (credit)
        receiver_txn = Transaction(
            senderId=current_user.id,
            receiverId=receiver.id,
            accountId=receiver_account.id,
            amount=data.amount,
            type="TRANSFER",
            category=data.category,
            description=data.description or f"Transfer from {current_user.firstName} {current_user.lastName}",
            status="COMPLETED",
            reference=reference + "_R"
        )
        db.add(receiver_txn)

        # Create notifications
        sender_notif = Notification(
            userId=current_user.id,
            title="Transfer Successful",
            message=f"You sent ${data.amount:,.2f} to {receiver.firstName} {receiver.lastName}.",
            type="SUCCESS"
        )
        db.add(sender_notif)

        receiver_notif = Notification(
            userId=receiver.id,
            title="Money Received",
            message=f"You received ${data.amount:,.2f} from {current_user.firstName} {current_user.lastName}.",
            type="SUCCESS"
        )
        db.add(receiver_notif)

        # Award reward points (1 point per $10 transferred)
        points_earned = int(data.amount // 10)
        if points_earned > 0:
            reward = db.query(RewardPoints).filter(RewardPoints.userId == current_user.id).first()
            if reward:
                reward.points += points_earned
                reward.totalEarned += points_earned
            else:
                new_reward = RewardPoints(
                    userId=current_user.id,
                    points=points_earned,
                    totalEarned=points_earned
                )
                db.add(new_reward)

        db.commit()

        return {
            "message": "Transfer successful",
            "reference": reference,
            "amount": data.amount,
            "recipient": {"name": f"{receiver.firstName} {receiver.lastName}", "email": receiver.email}
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Transfer failed: {str(e)}")
