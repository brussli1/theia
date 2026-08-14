from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from models.equipment import Equipment
from models.equipment import EquipmentCreate, EquipmentUpdate

class EquipmentCRUD:
    async def create(
        self, 
        db: AsyncSession, 
        equipment_data: EquipmentCreate
    ) -> Equipment:
        """Create new equipment listing"""
        db_equipment = Equipment(**equipment_data.dict())
        db.add(db_equipment)
        await db.commit()
        await db.refresh(db_equipment)
        return db_equipment
    
    async def get_by_id(
        self, 
        db: AsyncSession, 
        equipment_id: int
    ) -> Optional[Equipment]:
        """Get equipment by ID"""
        result = await db.execute(
            select(Equipment).where(Equipment.id == equipment_id)
        )
        return result.scalar_one_or_none()
    
    async def get_multiple(
        self, 
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        max_price: Optional[float] = None,
        certification: Optional[str] = None
    ) -> List[Equipment]:
        """Get multiple equipment with filtering"""
        query = select(Equipment).where(Equipment.is_active == True)
        
        # Apply filters
        if category:
            query = query.where(Equipment.category == category)
        if max_price:
            query = query.where(Equipment.price <= max_price)
        if certification:
            query = query.where(Equipment.certification == certification)
        
        # Add pagination
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def update(
        self, 
        db: AsyncSession, 
        equipment_id: int, 
        equipment_update: EquipmentUpdate
    ) -> Optional[Equipment]:
        """Update equipment"""
        # Get existing equipment
        result = await db.execute(
            select(Equipment).where(Equipment.id == equipment_id)
        )
        db_equipment = result.scalar_one_or_none()
        
        if not db_equipment:
            return None
        
        # Update fields
        update_data = equipment_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_equipment, field, value)
        
        await db.commit()
        await db.refresh(db_equipment)
        return db_equipment
    
    async def delete(
        self, 
        db: AsyncSession, 
        equipment_id: int
    ) -> bool:
        """Soft delete equipment (mark as inactive)"""
        result = await db.execute(
            select(Equipment).where(Equipment.id == equipment_id)
        )
        db_equipment = result.scalar_one_or_none()
        
        if not db_equipment:
            return False
        
        db_equipment.is_active = False
        await db.commit()
        return True

# Create instance
equipment_crud = EquipmentCRUD()
