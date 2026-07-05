from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

# ----------------- Auth / User -----------------
class UserRegister(BaseModel):
    firstName: str = Field(..., min_length=2)
    lastName: str = Field(..., min_length=2)
    email: str
    phone: Optional[str] = None
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    firstName: str
    lastName: str
    email: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    role: str
    status: str

# ----------------- Account -----------------
class AccountCreate(BaseModel):
    type: str = Field("CHECKING", pattern="^(CHECKING|SAVINGS|BUSINESS|INVESTMENT)$")
    currency: str = "USD"

class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userId: str
    accountNumber: str
    type: str
    balance: float
    currency: str
    status: str
    createdAt: datetime
    updatedAt: datetime

# ----------------- Transaction -----------------
class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    senderId: Optional[str] = None
    receiverId: Optional[str] = None
    accountId: str
    amount: float
    type: str
    category: str
    description: Optional[str] = None
    status: str
    reference: Optional[str] = None
    flagged: bool
    createdAt: datetime

class DepositRequest(BaseModel):
    accountId: str
    amount: float = Field(..., gt=0)
    description: Optional[str] = None

class TransferRequest(BaseModel):
    senderAccountId: str
    recipientEmail: str
    amount: float = Field(..., gt=0)
    category: str = "OTHER"
    description: Optional[str] = None

# ----------------- Budget -----------------
class BudgetCreate(BaseModel):
    category: str
    limit: float = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000)

class BudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userId: str
    category: str
    limit: float
    spent: float
    month: int
    year: int
    createdAt: datetime
    updatedAt: datetime

# ----------------- Card -----------------
class CardCreate(BaseModel):
    cardType: str = Field("VISA", pattern="^(VISA|MASTERCARD)$")

class CardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userId: str
    cardNumber: str
    expiry: str
    cvv: str
    cardType: str
    status: str
    createdAt: datetime
    updatedAt: datetime

# ----------------- Loan -----------------
class LoanCreate(BaseModel):
    amount: float = Field(..., gt=0)
    duration: int = Field(..., gt=0)  # months
    purpose: str
    employment: str
    income: float = Field(..., ge=0)

class LoanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userId: str
    amount: float
    interestRate: float
    duration: int
    purpose: str
    employment: str
    income: float
    status: str
    notes: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

# ----------------- Goal -----------------
class GoalCreate(BaseModel):
    name: str
    targetAmount: float = Field(..., gt=0)
    deadline: Optional[datetime] = None
    category: str = "OTHER"

class GoalAddFunds(BaseModel):
    amount: float = Field(..., gt=0)

class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userId: str
    name: str
    targetAmount: float
    savedAmount: float
    deadline: Optional[datetime] = None
    category: str
    status: str
    createdAt: datetime
    updatedAt: datetime

# ----------------- Scheduled Transfer -----------------
class ScheduledTransferCreate(BaseModel):
    toEmail: str
    amount: float = Field(..., gt=0)
    category: str = "OTHER"
    description: Optional[str] = None
    frequency: str = Field("ONCE", pattern="^(ONCE|WEEKLY|MONTHLY)$")
    nextRunAt: datetime

class ScheduledTransferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userId: str
    toEmail: str
    amount: float
    category: str
    description: Optional[str] = None
    frequency: str
    nextRunAt: datetime
    status: str
    createdAt: datetime
    updatedAt: datetime

# ----------------- Notification -----------------
class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userId: str
    title: str
    message: str
    type: str
    read: bool
    createdAt: datetime

# ----------------- Settings -----------------
class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    currency: Optional[str] = None
    emailNotifications: Optional[bool] = None
    pushNotifications: Optional[bool] = None
    transferAlerts: Optional[bool] = None
    loginAlerts: Optional[bool] = None
    marketingEmails: Optional[bool] = None
    twoFactorEnabled: Optional[bool] = None

class SettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userId: str
    theme: str
    language: str
    currency: str
    emailNotifications: bool
    pushNotifications: bool
    transferAlerts: bool
    loginAlerts: bool
    marketingEmails: bool
    twoFactorEnabled: bool
    updatedAt: datetime

# ----------------- Reward Points -----------------
class RewardPointsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userId: str
    points: int
    totalEarned: int
    totalRedeemed: int
    tier: str
    updatedAt: datetime
