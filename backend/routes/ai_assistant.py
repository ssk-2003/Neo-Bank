from fastapi import APIRouter, Depends, HTTPException, Body, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta

from backend.database import get_db
from backend.models import User, Account, Transaction, Budget, Loan, Goal, RewardPoints
from backend.auth import get_current_user

router = APIRouter(prefix="/ai-assistant", tags=["AI Assistant"])

def get_category_advice(category: str) -> str:
    advice = {
        "FOOD": "💡 Consider meal prepping, using grocery apps, or cooking at home more. This can save 30-40% on food costs.",
        "SHOPPING": "💡 Try the 30-day rule: wait 30 days before any non-essential purchase. Unsubscribe from promotional emails.",
        "BILLS": "💡 Review subscriptions you don't use. Bundle services and negotiate with providers for better rates.",
        "TRAVEL": "💡 Book flights 6-8 weeks in advance, use incognito mode for searches, and consider travel credit cards.",
        "ENTERTAINMENT": "💡 Share streaming subscriptions with family, look for free events in your city, set a monthly fun budget.",
        "HEALTHCARE": "💡 Preventive care is cheaper than treatment. Use generic medications and in-network providers.",
        "OTHER": "💡 Categorize these expenses to better understand and control your spending."
    }
    return advice.get(category, "💡 Track and categorize this spending to find savings opportunities.")

def get_overall_assessment(savings_rate: float, balance: float, over_budget_count: int) -> str:
    if savings_rate >= 20 and balance > 5000 and over_budget_count == 0:
        return "🌟 **Excellent!** Your finances are in great shape. Keep it up!"
    elif savings_rate >= 10 and balance > 1000:
        return "👍 **Good.** You're on the right track. Small improvements in budgeting will make a big difference."
    elif over_budget_count > 2 or savings_rate < 5:
        return "⚠️ **Needs Attention.** Focus on reducing overspending and building savings. Start with the biggest expense category."
    return "📊 **Fair.** There's room to improve. Set a budget for your top 3 spending categories and stick to it."

@router.post("")
def chat_with_assistant(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = payload.get("message")
    if not message:
        raise HTTPException(status_code=400, detail="Message required")

    # Fetch user financial data
    accounts = db.query(Account).filter(Account.userId == current_user.id, Account.status == "ACTIVE").all()
    
    # User's account IDs
    account_ids = [a.id for a in accounts]
    
    # Fetch transactions (last 90 days)
    ninety_days_ago = datetime.now() - timedelta(days=90)
    transactions = db.query(Transaction).filter(
        or_(
            Transaction.accountId.in_(account_ids),
            Transaction.senderId == current_user.id,
            Transaction.receiverId == current_user.id
        ),
        Transaction.createdAt >= ninety_days_ago
    ).order_by(Transaction.createdAt.desc()).all()

    budgets = db.query(Budget).filter(Budget.userId == current_user.id).all()
    loans = db.query(Loan).filter(Loan.userId == current_user.id).all()
    goals = db.query(Goal).filter(Goal.userId == current_user.id, Goal.status == "ACTIVE").all()
    reward_points = db.query(RewardPoints).filter(RewardPoints.userId == current_user.id).first()

    # Calculate financial metrics
    total_balance = sum(a.balance for a in accounts)
    spending = [t for t in transactions if t.senderId == current_user.id]
    income = [t for t in transactions if t.receiverId == current_user.id]
    total_spent = sum(t.amount for t in spending)
    total_income = sum(t.amount for t in income)

    # Category breakdown
    category_spend = {}
    for t in spending:
        category_spend[t.category] = category_spend.get(t.category, 0.0) + t.amount
    
    top_category = None
    if category_spend:
        top_category = sorted(category_spend.items(), key=lambda x: x[1], reverse=True)[0]

    # Monthly data
    now = datetime.now()
    this_month_spending = [t for t in spending if t.createdAt.month == now.month and t.createdAt.year == now.year]
    this_month_income = [t for t in income if t.createdAt.month == now.month and t.createdAt.year == now.year]
    monthly_spend = sum(t.amount for t in this_month_spending)
    monthly_income = sum(t.amount for t in this_month_income)

    # Over-budget categories
    over_budget = [b for b in budgets if b.spent > b.limit]
    near_budget = [b for b in budgets if (b.spent / b.limit) > 0.85 and b.spent <= b.limit]

    # Savings rate
    savings_rate = ((total_income - total_spent) / total_income) * 100 if total_income > 0 else 0.0

    # Generate reply
    msg = message.lower()
    reply = ""

    if "balance" in msg or "how much" in msg or "total" in msg:
        reply = (
            f"💰 **Your Current Financial Overview**\n\n"
            f"- **Total Balance**: ${total_balance:,.2f} across {len(accounts)} account(s)\n"
            f"- **This Month Spent**: ${monthly_spend:,.2f}\n"
            f"- **This Month Income**: ${monthly_income:,.2f}\n"
            f"- **Net This Month**: {'+' if monthly_income >= monthly_spend else ''}${(monthly_income - monthly_spend):,.2f}\n\n"
        )
        if total_balance < 500:
            reply += "⚠️ Your balance is getting low. Consider reducing non-essential spending."
        elif total_balance > 10000:
            reply += "✅ Great job keeping a healthy balance!"
        else:
            reply += "📊 Your balance looks healthy."
            
    elif "spend" in msg or "spent" in msg or "expense" in msg or "where" in msg:
        lines = []
        for cat, amt in sorted(category_spend.items(), key=lambda x: x[1], reverse=True):
            lines.append(f"  - **{cat}**: ${amt:,.2f}")
        lines_str = "\n".join(lines)
        
        reply = f"📊 **Your Spending Breakdown (Last 90 Days)**\n\n{lines_str or 'No spending data available.'}\n\n"
        if top_category:
            reply += f"🏆 Your biggest expense category is **{top_category[0]}** at ${top_category[1]:,.2f}."
            
    elif "save" in msg or "saving" in msg or "cut" in msg:
        reply = (
            f"💡 **Personalized Savings Advice**\n\n"
            f"Your current savings rate is **{savings_rate:.1f}%**.\n\n"
            f"**Tips based on your spending:**\n"
        )
        if category_spend.get("ENTERTAINMENT", 0) > 100:
            reply += f"- 🎬 You spent ${category_spend['ENTERTAINMENT']:,.2f} on entertainment. Consider the 50/30/20 rule.\n"
        if category_spend.get("FOOD", 0) > 400:
            reply += f"- 🍔 Your food spending (${category_spend['FOOD']:,.2f}) is high. Meal prep can save 30-40%.\n"
        if category_spend.get("SHOPPING", 0) > 300:
            reply += f"- 🛒 Shopping (${category_spend['SHOPPING']:,.2f}) — try a 24-hour rule before purchases.\n"
        if over_budget:
            reply += f"- ⚠️ You've exceeded budget in: {', '.join(b.category for b in over_budget)}.\n"
        reply += f"\n🎯 **Goal**: Try to reach a 20% savings rate. You're currently at {savings_rate:.1f}%."
        
    elif "loan" in msg or "borrow" in msg or "debt" in msg:
        active_loans = [l for l in loans if l.status in ["APPROVED", "ACTIVE"]]
        pending_loans = [l for l in loans if l.status == "PENDING"]
        reply = f"🏦 **Loan Status**\n\n"
        if not active_loans and not pending_loans:
            reply += (
                f"You have no active loans. Your debt-to-income ratio is excellent!\n\n"
                f"💡 If you need a loan, keep it below 30% of your monthly income."
            )
        else:
            for l in active_loans:
                r_monthly = l.interestRate / 100 / 12
                emi = (l.amount * r_monthly * ((1 + r_monthly) ** l.duration)) / (((1 + r_monthly) ** l.duration) - 1)
                reply += f"- **{l.purpose}**: ${l.amount:,.2f} @ {l.interestRate}% for {l.duration} months (EMI: ~${emi:,.2f})\n"
            if pending_loans:
                reply += f"- {len(pending_loans)} pending application(s) under review\n"
                
    elif "budget" in msg or "limit" in msg:
        reply = f"📋 **Budget Status**\n\n"
        if not budgets:
            reply += (
                f"You haven't set up any budgets yet. Setting budgets is one of the best ways to control spending!\n\n"
                f"💡 Tip: Start with your top spending categories and set realistic limits."
            )
        else:
            for b in budgets:
                pct = (b.spent / b.limit) * 100 if b.limit > 0 else 0
                bar = "🔴" if pct > 100 else "🟡" if pct > 85 else "🟢"
                reply += f"{bar} **{b.category}**: ${b.spent:,.2f} / ${b.limit:,.2f} ({pct:.0f}%)\n"
            if over_budget:
                reply += f"\n⚠️ Over budget: {', '.join(b.category for b in over_budget)}"
                
    elif "goal" in msg or "target" in msg or "dream" in msg:
        reply = f"🎯 **Savings Goals**\n\n"
        if not goals:
            reply += "You haven't set any savings goals yet. Goals help you stay motivated!\n\nTry setting a goal for an emergency fund, vacation, or a big purchase."
        else:
            for g in goals:
                pct = (g.savedAmount / g.targetAmount) * 100 if g.targetAmount > 0 else 0
                reply += f"- **{g.name}**: ${g.savedAmount:,.2f} / ${g.targetAmount:,.2f} ({pct:.0f}%)\n"
                if g.deadline:
                    days = (g.deadline.replace(tzinfo=None) - datetime.now()).days
                    if days > 0:
                        needed = (g.targetAmount - g.savedAmount) / (days / 30.0) if days > 30 else (g.targetAmount - g.savedAmount)
                        reply += f"  You need to save ~${needed:,.2f}/month to hit your deadline.\n"
                        
    elif "reward" in msg or "point" in msg or "cashback" in msg:
        reply = f"⭐ **Reward Points**\n\n"
        if not reward_points:
            reply += "No reward points yet. Start transferring to earn points!"
        else:
            reply += f"- **Current Points**: {reward_points.points:,} pts\n"
            reply += f"- **Total Earned**: {reward_points.totalEarned:,} pts\n"
            reply += f"- **Tier**: {reward_points.tier} 🏅\n\n"
            next_tier = (
                "Silver (2,000 pts)" if reward_points.tier == "BRONZE" else
                "Gold (5,000 pts)" if reward_points.tier == "SILVER" else
                "Platinum (10,000 pts)" if reward_points.tier == "GOLD" else "the top tier!"
            )
            reply += f"💡 You earn 1 point for every $10 transferred. Keep it up to reach {next_tier}!"
            
    elif "advice" in msg or "help" in msg or "tip" in msg or "suggest" in msg:
        reply = f"💼 **Personalized Financial Advice**\n\n"
        tips = []
        if savings_rate < 10:
            tips.append("📉 Your savings rate is below 10%. Aim for at least 20% using the 50/30/20 rule.")
        if over_budget:
            tips.append(f"⚠️ You're over budget in {len(over_budget)} categories. Review and adjust.")
        if any(l.status == "ACTIVE" for l in loans):
            tips.append("💳 Pay off your loan EMIs on time to build a strong credit profile.")
        if total_balance < 1000:
            tips.append("🔐 Build an emergency fund of at least 3-6 months of expenses.")
        if not goals:
            tips.append("🎯 Set savings goals to stay motivated and track progress.")
        if category_spend.get("FOOD", 0) > monthly_income * 0.3 if monthly_income > 0 else False:
            tips.append("🍽️ Food spending is more than 30% of income. Meal planning can help.")
            
        if not tips:
            tips.append("✅ Your finances look healthy! Keep maintaining your budget and savings rate.")
        reply += "\n\n".join(tips)
        
    elif "biggest" in msg or "most" in msg or "largest" in msg:
        if top_category:
            pct = (top_category[1] / total_spent * 100) if total_spent > 0 else 0
            reply = f"📊 Your biggest expense is **{top_category[0]}** at ${top_category[1]:,.2f} over the last 90 days.\n\n"
            reply += f"This represents {pct:.1f}% of your total spending.\n\n"
            reply += get_category_advice(top_category[0])
        else:
            reply = "No significant spending data found in the last 90 days."
            
    elif "summarize" in msg or "summary" in msg or "overview" in msg:
        reply = (
            f"📈 **Financial Summary**\n\n"
            f"💰 **Total Balance**: ${total_balance:,.2f}\n"
            f"📤 **Total Spent (90d)**: ${total_spent:,.2f}\n"
            f"📥 **Total Income (90d)**: ${total_income:,.2f}\n"
            f"💾 **Savings Rate**: {savings_rate:.1f}%\n"
            f"🏦 **Active Loans**: {len([l for l in loans if l.status in ['APPROVED', 'ACTIVE']])}\n"
            f"🎯 **Active Goals**: {len(goals)}\n"
            f"⭐ **Reward Points**: {reward_points.points if reward_points else 0:,}\n\n"
        )
        if over_budget:
            reply += f"⚠️ Overspent in: {', '.join(b.category for b in over_budget)}\n"
        reply += f"\n{get_overall_assessment(savings_rate, total_balance, len(over_budget))}"
        
    else:
        reply = (
            f"🤖 **NeoBank AI Assistant**\n\nI can help you with:\n\n"
            f"- 💰 \"What's my balance?\"\n"
            f"- 📊 \"Where do I spend the most?\"\n"
            f"- 💡 \"How can I save money?\"\n"
            f"- 🏦 \"What's my loan status?\"\n"
            f"- 📋 \"Show my budget status\"\n"
            f"- 🎯 \"Tell me about my goals\"\n"
            f"- ⭐ \"How many reward points do I have?\"\n"
            f"- 📈 \"Summarize my finances\"\n\n"
            f"Just ask me anything about your finances!"
        )

    return {
        "reply": reply,
        "timestamp": datetime.now().isoformat()
    }
