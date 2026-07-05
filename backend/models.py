from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from datetime import datetime
from backend.database import Base

def generate_id():
    # Return a unique 25-character string similar to cuid format
    # cuid starts with 'c' and is 25 chars.
    return "c" + uuid.uuid4().hex[:24]

class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True, default=generate_id)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=True)
    password = Column(String, nullable=False)
    avatar = Column(String, nullable=True)
    role = Column(String, default="CUSTOMER")
    status = Column(String, default="ACTIVE")
    emailVerified = Column(Boolean, default=False)
    twoFactorEnabled = Column(Boolean, default=False)
    referralCode = Column(String, unique=True, nullable=True)
    referredBy = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)

    # Relationships
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
    sentTransactions = relationship("Transaction", foreign_keys="[Transaction.senderId]", back_populates="sender")
    receivedTransactions = relationship("Transaction", foreign_keys="[Transaction.receiverId]", back_populates="receiver")
    loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    cards = relationship("Card", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("Settings", uselist=False, back_populates="user", cascade="all, delete-orphan")
    rewardPoints = relationship("RewardPoints", uselist=False, back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    scheduledTransfers = relationship("ScheduledTransfer", back_populates="user", cascade="all, delete-orphan")


class Account(Base):
    __tablename__ = "Account"

    id = Column(String, primary_key=True, default=generate_id)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    accountNumber = Column(String, unique=True, nullable=False, index=True)
    type = Column(String, default="CHECKING")
    balance = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    status = Column(String, default="ACTIVE")
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)

    # Relationships
    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", foreign_keys="[Transaction.accountId]", back_populates="account")


class Transaction(Base):
    __tablename__ = "Transaction"

    id = Column(String, primary_key=True, default=generate_id)
    senderId = Column(String, ForeignKey("User.id"), nullable=True)
    receiverId = Column(String, ForeignKey("User.id"), nullable=True)
    accountId = Column(String, ForeignKey("Account.id"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # TRANSFER | DEPOSIT | WITHDRAWAL | PAYMENT
    category = Column(String, default="OTHER")
    description = Column(String, nullable=True)
    status = Column(String, default="COMPLETED")
    reference = Column(String, unique=True, nullable=True)
    flagged = Column(Boolean, default=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    account = relationship("Account", foreign_keys=[accountId], back_populates="transactions")
    sender = relationship("User", foreign_keys=[senderId], back_populates="sentTransactions")
    receiver = relationship("User", foreign_keys=[receiverId], back_populates="receivedTransactions")


class Loan(Base):
    __tablename__ = "Loan"

    id = Column(String, primary_key=True, default=generate_id)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    interestRate = Column(Float, default=8.5)
    duration = Column(Integer, nullable=False)
    purpose = Column(String, nullable=False)
    employment = Column(String, nullable=False)
    income = Column(Float, nullable=False)
    status = Column(String, default="PENDING")
    notes = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)

    # Relationships
    user = relationship("User", back_populates="loans")


class Budget(Base):
    __tablename__ = "Budget"

    id = Column(String, primary_key=True, default=generate_id)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)
    limit = Column(Float, nullable=False)
    spent = Column(Float, default=0.0)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)

    # Unique constraint matching Prisma schema
    __table_args__ = (
        UniqueConstraint('userId', 'category', 'month', 'year', name='_Budget_uc'),
    )

    # Relationships
    user = relationship("User", back_populates="budgets")


class Card(Base):
    __tablename__ = "Card"

    id = Column(String, primary_key=True, default=generate_id)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    cardNumber = Column(String, unique=True, nullable=False, index=True)
    expiry = Column(String, nullable=False)
    cvv = Column(String, nullable=False)
    cardType = Column(String, default="VISA")
    status = Column(String, default="ACTIVE")
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)

    # Relationships
    user = relationship("User", back_populates="cards")


class Notification(Base):
    __tablename__ = "Notification"

    id = Column(String, primary_key=True, default=generate_id)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="INFO")
    read = Column(Boolean, default=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")


class Settings(Base):
    __tablename__ = "Settings"

    id = Column(String, primary_key=True, default=generate_id)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), unique=True, nullable=False)
    theme = Column(String, default="dark")
    language = Column(String, default="en")
    currency = Column(String, default="USD")
    emailNotifications = Column(Boolean, default=True)
    pushNotifications = Column(Boolean, default=True)
    transferAlerts = Column(Boolean, default=True)
    loginAlerts = Column(Boolean, default=True)
    marketingEmails = Column(Boolean, default=False)
    twoFactorEnabled = Column(Boolean, default=False)
    updatedAt = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)

    # Relationships
    user = relationship("User", back_populates="settings")


class RewardPoints(Base):
    __tablename__ = "RewardPoints"

    id = Column(String, primary_key=True, default=generate_id)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), unique=True, nullable=False)
    points = Column(Integer, default=0)
    totalEarned = Column(Integer, default=0)
    totalRedeemed = Column(Integer, default=0)
    tier = Column(String, default="BRONZE")
    updatedAt = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)

    # Relationships
    user = relationship("User", back_populates="rewardPoints")


class Goal(Base):
    __tablename__ = "Goal"

    id = Column(String, primary_key=True, default=generate_id)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    targetAmount = Column(Float, nullable=False)
    savedAmount = Column(Float, default=0.0)
    deadline = Column(DateTime(timezone=True), nullable=True)
    category = Column(String, default="OTHER")
    status = Column(String, default="ACTIVE")
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)

    # Relationships
    user = relationship("User", back_populates="goals")


class ScheduledTransfer(Base):
    __tablename__ = "ScheduledTransfer"

    id = Column(String, primary_key=True, default=generate_id)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    toEmail = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, default="OTHER")
    description = Column(String, nullable=True)
    frequency = Column(String, nullable=False)
    nextRunAt = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="ACTIVE")
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)

    # Relationships
    user = relationship("User", back_populates="scheduledTransfers")
