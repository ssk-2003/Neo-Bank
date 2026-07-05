# FastAPI Application Entrypoint - Reload models
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.config import Config
from backend.routes import (
    auth,
    accounts,
    transactions,
    transfer,
    budgets,
    cards,
    loans,
    goals,
    notifications,
    settings,
    user,
    expenses,
    dashboard,
    ai_assistant,
    admin
)

app = FastAPI(title="NeoBank API", version="1.0.0")

# Setup CORS middleware
# Helpful during direct local debugging, though Next.js proxying is used
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expose public health check
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "NeoBank Python API Backend"}

# Include routers under `/api` prefix
# Note: Auth, Transactions, and AI Assistant are nested as needed
app.include_router(auth.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(transfer.router, prefix="/api")
app.include_router(budgets.router, prefix="/api")
app.include_router(cards.router, prefix="/api")
app.include_router(loans.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(ai_assistant.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("main:app", host=Config.HOST, port=Config.PORT, reload=True)
