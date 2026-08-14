from fastapi import FastAPI
from routers import equipment

app = FastAPI(title="Theia Ophthalmology Platform", version="1.0.0")

app.include_router(equipment.router)

@app.get("/")
async def read_root():
    return {"message": "Welcome to Theia Ophthalmology Platform"}
