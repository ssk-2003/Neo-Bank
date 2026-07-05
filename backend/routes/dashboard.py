from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import datetime, timedelta, timezone

from backend.database import get_db
from backend.models import User, Account, Transaction, Budget, Loan, Notification, Goal, RewardPoints
from backend.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now()
    
    # Calculate dates
    this_month_start = datetime(now.year, now.month, 1)
    
    # Fetch user's account IDs
    user_accounts = db.query(Account).filter(Account.userId == current_user.id).all()
    account_ids = [a.id for a in user_accounts]

    # Fetch accounts
    accounts = user_accounts

    # Fetch 8 most recent transactions with sender/receiver details
    recent_transactions_raw = db.query(Transaction).filter(
        or_(
            Transaction.accountId.in_(account_ids),
            Transaction.senderId == current_user.id,
            Transaction.receiverId == current_user.id
        )
    ).order_by(Transaction.createdAt.desc()).limit(8).all()

    recent_transactions = []
    for t in recent_transactions_raw:
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
                "avatar": t.sender.avatar
            } if t.sender else None,
            "receiver": {
                "firstName": t.receiver.firstName,
                "lastName": t.receiver.lastName,
                "avatar": t.receiver.avatar
            } if t.receiver else None
        })

    # Fetch budgets for user for current month and year
    budgets = db.query(Budget).filter(
        Budget.userId == current_user.id,
        Budget.month == now.month,
        Budget.year == now.year
    ).all()

    # Fetch latest loan application
    latest_loan = db.query(Loan).filter(Loan.userId == current_user.id).order_by(Loan.createdAt.desc()).first()

    # Fetch 5 most recent unread notifications
    notifications = db.query(Notification).filter(
        Notification.userId == current_user.id,
        Notification.read == False
    ).order_by(Notification.createdAt.desc()).limit(5).all()

    # Fetch 3 active goals
    goals = db.query(Goal).filter(
        Goal.userId == current_user.id,
        Goal.status == "ACTIVE"
    ).limit(3).all()

    # Fetch reward points record
    reward_points = db.query(RewardPoints).filter(RewardPoints.userId == current_user.id).first()

    # Calculate this month spending sum
    monthly_expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.senderId == current_user.id,
        Transaction.type != "DEPOSIT",
        Transaction.createdAt >= this_month_start
    ).scalar() or 0.0

    # Calculate this month income sum
    monthly_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.receiverId == current_user.id,
        Transaction.createdAt >= this_month_start
    ).scalar() or 0.0

    # Category breakdown (last 30 days)
    thirty_days_ago = now - timedelta(days=30)
    category_breakdown_raw = db.query(
        Transaction.category,
        func.sum(Transaction.amount)
    ).filter(
        Transaction.senderId == current_user.id,
        Transaction.createdAt >= thirty_days_ago
    ).group_by(Transaction.category).all()

    category_breakdown = [{"category": cat, "total": float(tot or 0)} for cat, tot in category_breakdown_raw]

    # Spending trend (last 6 months)
    six_months_ago = now - timedelta(days=180)
    trend_transactions = db.query(Transaction).filter(
        or_(
            Transaction.senderId == current_user.id,
            Transaction.receiverId == current_user.id
        ),
        Transaction.createdAt >= six_months_ago,
        Transaction.status == "COMPLETED"
    ).all()

    # Prepopulate the monthly trend dict for the last 6 months
    monthly_map = {}
    for i in range(5, -1, -1):
        # Subtract months correctly
        m_year = now.year
        m_month = now.month - i
        while m_month <= 0:
            m_month += 12
            m_year -= 1
        key = f"{m_year}-{m_month:02d}"
        monthly_map[key] = {"month": key, "spending": 0.0, "income": 0.0}

    for tx in trend_transactions:
        tx_date = tx.createdAt
        key = f"{tx_date.year}-{tx_date.month:02d}"
        if key in monthly_map:
            if tx.senderId == current_user.id:
                monthly_map[key]["spending"] += tx.amount
            if tx.receiverId == current_user.id:
                monthly_map[key]["income"] += tx.amount

    spending_trend = sorted(monthly_map.values(), key=lambda x: x["month"])

    total_balance = sum(a.balance for a in accounts)

    return {
        "summary": {
            "totalBalance": total_balance,
            "monthlyIncome": monthly_income,
            "monthlyExpenses": monthly_expenses,
            "savings": total_balance
        },
        "accounts": accounts,
        "recentTransactions": recent_transactions,
        "budgets": budgets,
        "latestLoan": latest_loan,
        "notifications": notifications,
        "goals": goals,
        "rewardPoints": reward_points,
        "charts": {
            "categoryBreakdown": category_breakdown,
            "spendingTrend": spending_trend
        }
    }
