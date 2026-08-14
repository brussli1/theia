import asyncio
from core.database import engine, Base
from models.equipment import Equipment  # Import your models

async def create_tables():
    async with engine.begin() as conn:
        # Drop all tables (be careful in production!)
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully!")

if __name__ == "__main__":
    asyncio.run(create_tables())
