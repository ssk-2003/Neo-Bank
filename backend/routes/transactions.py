from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import datetime
import random
import string

from backend.database import get_db
from backend.models import User, Account, Transaction, Notification
from backend.schemas import DepositRequest
from backend.auth import get_current_user

router = APIRouter(tags=["Transactions"])

@router.get("/transactions")
def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1),
    category: str | None = Query(None),
    type: str | None = Query(None),
    status: str | None = Query(None),
    search: str | None = Query(None),
    startDate: str | None = Query(None),
    endDate: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    skip = (page - 1) * limit

    # Get all account IDs for this user
    user_accounts = db.query(Account).filter(Account.userId == current_user.id).all()
    account_ids = [a.id for a in user_accounts]

    # Core condition: transaction is on user's accounts, or user sent/received it
    conditions = or_(
        Transaction.accountId.in_(account_ids),
        Transaction.senderId == current_user.id,
        Transaction.receiverId == current_user.id
    )

    filters = [conditions]

    if category:
        filters.append(Transaction.category == category)
    if type:
        filters.append(Transaction.type == type)
    if status:
        filters.append(Transaction.status == status)
    if search:
        # Case insensitive search on description
        filters.append(Transaction.description.ilike(f"%{search}%"))
        
    if startDate:
        try:
            start_dt = datetime.fromisoformat(startDate.replace("Z", "+00:00"))
            filters.append(Transaction.createdAt >= start_dt)
        except ValueError:
            pass
    if endDate:
        try:
            end_dt = datetime.fromisoformat(endDate.replace("Z", "+00:00"))
            filters.append(Transaction.createdAt <= end_dt)
        except ValueError:
            pass

    query_filter = and_(*filters)

    # Fetch total count
    total = db.query(Transaction).filter(query_filter).count()

    # Fetch paginated transactions
    transactions = db.query(Transaction).filter(query_filter)\
        .order_by(Transaction.createdAt.desc())\
        .offset(skip).limit(limit).all()

    # Serialize matching the Next.js API client contract
    result = []
    for t in transactions:
        result.append({
            "id": t.id,
            "senderId": t.senderId,
            "receiverId": t.receiverId,
            "accountId": t.accountId,
            "amount": t.amount,
            "type": t.type,
            "category": t.category,
            "description": t.description,
            "status": t.status,
            "reference": t.reference,
            "flagged": t.flagged,
            "createdAt": t.createdAt,
            "sender": {
                "firstName": t.sender.firstName,
                "lastName": t.sender.lastName,
                "email": t.sender.email,
                "avatar": t.sender.avatar
            } if t.sender else None,
            "receiver": {
                "firstName": t.receiver.firstName,
                "lastName": t.receiver.lastName,
                "email": t.receiver.email,
                "avatar": t.receiver.avatar
            } if t.receiver else None,
            "account": {
                "type": t.account.type,
                "currency": t.account.currency
            } if t.account else None
        })

    return {
        "transactions": result,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    }

@router.post("/deposit")
def deposit(
    data: DepositRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify account belongs to user and is active
    account = db.query(Account).filter(
        Account.id == data.accountId,
        Account.userId == current_user.id,
        Account.status == "ACTIVE"
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found or inactive")

    # Generate a unique reference
    reference = "DEP" + str(int(datetime.now().timestamp() * 1000)) + "".join(random.choices(string.ascii_uppercase + string.digits, k=4))

    # Perform transaction operations
    try:
        account.balance += data.amount
        
        new_transaction = Transaction(
            accountId=data.accountId,
            receiverId=current_user.id,
            amount=data.amount,
            type="DEPOSIT",
            category="OTHER",
            description=data.description or "Demo Money Deposit",
            status="COMPLETED",
            reference=reference
        )
        db.add(new_transaction)

        new_notif = Notification(
            userId=current_user.id,
            title="Demo Money Added 💰",
            message=f"${data.amount:,.2f} demo funds added to your account ending in {account.accountNumber[-4:]}.",
            type="SUCCESS"
        )
        db.add(new_notif)
        db.commit()
        db.refresh(account)

        return {
            "account": account,
            "reference": reference,
            "amount": data.amount,
            "message": "Demo funds added successfully!"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Deposit failed: {str(e)}")
