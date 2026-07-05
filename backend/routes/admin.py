from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import datetime, timedelta, timezone

from backend.database import get_db
from backend.models import User, Account, Transaction, Loan, Notification
from backend.auth import get_current_user, require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/analytics")
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    now = datetime.now()
    this_month_start = datetime(now.year, now.month, 1)

    # Core statistics
    total_users = db.query(User).filter(User.role == "CUSTOMER").count()
    total_accounts = db.query(Account).count()
    total_transactions = db.query(Transaction).count()
    pending_loans = db.query(Loan).filter(Loan.status == "PENDING").count()
    active_loans = db.query(Loan).filter(Loan.status == "ACTIVE").count()
    
    new_users_this_month = db.query(User).filter(User.createdAt >= this_month_start).count()
    transactions_this_month = db.query(Transaction).filter(Transaction.createdAt >= this_month_start).count()
    
    revenue_sum = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "TRANSFER",
        Transaction.createdAt >= this_month_start
    ).scalar() or 0.0
    system_revenue = float(revenue_sum) * 0.001  # 0.1% fee simulation

    # 10 recent transactions
    recent_tx = db.query(Transaction).order_by(Transaction.createdAt.desc()).limit(10).all()
    recent_transactions = []
    for t in recent_tx:
        recent_transactions.append({
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
                "email": t.sender.email
            } if t.sender else None,
            "receiver": {
                "firstName": t.receiver.firstName,
                "lastName": t.receiver.lastName,
                "email": t.receiver.email
            } if t.receiver else None
        })

    # Users registered per month (last 6 months)
    six_months_ago = now - timedelta(days=180)
    users_list = db.query(User.createdAt).filter(User.createdAt >= six_months_ago).all()
    
    users_map = {}
    for i in range(5, -1, -1):
        m_year = now.year
        m_month = now.month - i
        while m_month <= 0:
            m_month += 12
            m_year -= 1
        key = f"{m_year}-{m_month:02d}"
        users_map[key] = 0

    for u in users_list:
        u_date = u[0]
        key = f"{u_date.year}-{u_date.month:02d}"
        if key in users_map:
            users_map[key] += 1
            
    users_by_month = sorted(
        [{"month": month, "count": count} for month, count in users_map.items()],
        key=lambda x: x["month"]
    )

    # Transactions per day (last 7 days)
    seven_days_ago = now - timedelta(days=7)
    transactions_list = db.query(Transaction.createdAt, Transaction.amount).filter(
        Transaction.createdAt >= seven_days_ago
    ).all()

    trans_map = {}
    for i in range(6, -1, -1):
        d = now - timedelta(days=i)
        key = d.strftime("%Y-%m-%d")
        trans_map[key] = {"count": 0, "total": 0.0}

    for t_date, t_amount in transactions_list:
        key = t_date.strftime("%Y-%m-%d")
        if key in trans_map:
            trans_map[key]["count"] += 1
            trans_map[key]["total"] += float(t_amount)

    transactions_by_day = sorted(
        [
            {
                "day": day,
                "count": val["count"],
                "total": val["total"]
            }
            for day, val in trans_map.items()
        ],
        key=lambda x: x["day"]
    )

    return {
        "overview": {
            "totalUsers": total_users,
            "totalAccounts": total_accounts,
            "totalTransactions": total_transactions,
            "pendingLoans": pending_loans,
            "activeLoans": active_loans,
            "newUsersThisMonth": new_users_this_month,
            "transactionsThisMonth": transactions_this_month,
            "systemRevenue": system_revenue
        },
        "charts": {
            "usersByMonth": users_by_month,
            "transactionsByDay": transactions_by_day
        },
        "recentTransactions": recent_transactions
    }

@router.get("/loans")
def get_all_loans(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    loans = db.query(Loan).order_by(Loan.createdAt.desc()).all()
    result = []
    for l in loans:
        result.append({
            "id": l.id,
            "userId": l.userId,
            "amount": l.amount,
            "interestRate": l.interestRate,
            "duration": l.duration,
            "purpose": l.purpose,
            "employment": l.employment,
            "income": l.income,
            "status": l.status,
            "notes": l.notes,
            "createdAt": l.createdAt,
            "updatedAt": l.updatedAt,
            "user": {
                "id": l.user.id,
                "firstName": l.user.firstName,
                "lastName": l.user.lastName,
                "email": l.user.email,
                "avatar": l.user.avatar
            }
        })
    return {"loans": result}

@router.put("/loans")
def update_loan_status(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    loan_id = payload.get("loanId")
    status_val = payload.get("status")
    notes = payload.get("notes")

    if not loan_id or not status_val:
        raise HTTPException(status_code=400, detail="loanId and status required")

    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    loan.status = status_val
    if notes:
        loan.notes = notes

    # If approved, credit loan amount to user's account
    if status_val in ["APPROVED", "ACTIVE"]:
        account = db.query(Account).filter(Account.userId == loan.userId, Account.status == "ACTIVE").first()
        if account:
            account.balance += loan.amount
            
            # Create disbursement transaction
            disb_reference = "LOAN" + str(int(datetime.now().timestamp() * 1000))
            db.add(Transaction(
                accountId=account.id,
                receiverId=loan.userId,
                amount=loan.amount,
                type="DEPOSIT",
                category="OTHER",
                description=f"Loan disbursement - {loan.purpose}",
                status="COMPLETED",
                reference=disb_reference
            ))

    # Notify user
    notif_map = {
        "APPROVED": {
            "title": "Loan Approved! 🎉",
            "message": f"Your loan of ${loan.amount:,.2f} has been approved and disbursed to your account.",
            "type": "SUCCESS"
        },
        "ACTIVE": {
            "title": "Loan Disbursed",
            "message": f"Your loan of ${loan.amount:,.2f} is now active.",
            "type": "SUCCESS"
        },
        "REJECTED": {
            "title": "Loan Application Rejected",
            "message": notes or "Your loan application was not approved. Contact support for details.",
            "type": "ERROR"
        }
    }

    notif_info = notif_map.get(status_val)
    if notif_info:
        db.add(Notification(
            userId=loan.userId,
            title=notif_info["title"],
            message=notif_info["message"],
            type=notif_info["type"]
        ))

    db.commit()
    db.refresh(loan)

    return {"loan": loan}

@router.get("/users")
def get_all_users(
    search: str = Query(""),
    role: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    skip = (page - 1) * limit
    
    filters = []
    if role:
        filters.append(User.role == role)
    if status:
        filters.append(User.status == status)
        
    if search:
        filters.append(
            or_(
                User.firstName.ilike(f"%{search}%"),
                User.lastName.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )

    query_filter = and_(*filters) if filters else True

    # Count total users matching filters
    total = db.query(User).filter(query_filter).count()

    # Get users list
    users = db.query(User).filter(query_filter)\
        .order_by(User.createdAt.desc())\
        .offset(skip).limit(limit).all()

    # Structure users output containing account counts, sent transaction counts, etc.
    result = []
    for u in users:
        accounts_cnt = db.query(Account).filter(Account.userId == u.id).count()
        sent_tx_cnt = db.query(Transaction).filter(Transaction.senderId == u.id).count()
        loans_cnt = db.query(Loan).filter(Loan.userId == u.id).count()
        
        result.append({
            "id": u.id,
            "firstName": u.firstName,
            "lastName": u.lastName,
            "email": u.email,
            "phone": u.phone,
            "avatar": u.avatar,
            "role": u.role,
            "status": u.status,
            "emailVerified": u.emailVerified,
            "createdAt": u.createdAt,
            "_count": {
                "accounts": accounts_cnt,
                "sentTransactions": sent_tx_cnt,
                "loans": loans_cnt
            }
        })

    return {
        "users": result,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    }

@router.put("/users")
def update_user_status_role(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    user_id = payload.get("userId")
    status_val = payload.get("status")
    role_val = payload.get("role")

    if not user_id:
        raise HTTPException(status_code=400, detail="userId required")

    # Prevent self modification
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if status_val is not None:
        user.status = status_val
    if role_val is not None:
        user.role = role_val

    # Notify user of status change
    if status_val:
        title = "Account Frozen" if status_val == "FROZEN" else "Account Activated"
        message = (
            "Your account has been frozen by an administrator. Contact support."
            if status_val == "FROZEN"
            else "Your account has been reactivated."
        )
        notif_type = "WARNING" if status_val == "FROZEN" else "SUCCESS"
        db.add(Notification(
            userId=user_id,
            title=title,
            message=message,
            type=notif_type
        ))

    db.commit()
    db.refresh(user)

    return {
        "user": {
            "id": user.id,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "email": user.email,
            "status": user.status,
            "role": user.role
        }
    }
