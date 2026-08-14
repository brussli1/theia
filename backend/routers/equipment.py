from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from core.database import get_db
from models.equipment import (
    EquipmentCreate, 
    EquipmentUpdate, 
    EquipmentResponse
)
from app.crud.equipment import equipment_crud

router = APIRouter(prefix="/equipment", tags=["equipment"])

@router.post("/", response_model=EquipmentResponse)
async def create_equipment(
    equipment: EquipmentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create new equipment listing"""
    return await equipment_crud.create(db=db, equipment_data=equipment)

@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(
    equipment_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get equipment by ID"""
    equipment = await equipment_crud.get_by_id(db=db, equipment_id=equipment_id)
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment

@router.get("/", response_model=List[EquipmentResponse])
async def list_equipment(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None, gt=0),
    certification: Optional[str] = Query(None, regex="^(FDA|CE|ISO)$"),
    db: AsyncSession = Depends(get_db)
):
    """List equipment with filtering"""
    equipment_list = await equipment_crud.get_multiple(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        max_price=max_price,
        certification=certification
    )
    return equipment_list

@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: int,
    equipment_update: EquipmentUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update equipment"""
    equipment = await equipment_crud.update(
        db=db, 
        equipment_id=equipment_id, 
        equipment_update=equipment_update
    )
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment

@router.delete("/{equipment_id}")
async def delete_equipment(
    equipment_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete equipment (soft delete)"""
    deleted = await equipment_crud.delete(db=db, equipment_id=equipment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return {"message": "Equipment deleted successfully"}
