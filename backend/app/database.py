from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

# Format: mysql+aiomysql://user:password@host:port/dbname
DATABASE_URL = f"mysql+aiomysql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"ssl": False} # Equivalent to rejectUnauthorized: false in mysql2, but aiomysql usually just connects without ssl if parameter not set, or we can omit it if not needed. We'll leave it simple. If SSL is strictly needed, we create SSL context.
)

async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()
