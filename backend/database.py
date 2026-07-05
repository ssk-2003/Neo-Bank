from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import Config

if not Config.DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set!")

# Create the SQLAlchemy engine
# pool_pre_ping=True prevents connection drops (especially useful with cloud DBs like Neon)
engine = create_engine(
    Config.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
