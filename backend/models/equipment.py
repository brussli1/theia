from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from models.equipment import Equipment
from models.equipment import EquipmentCreate, EquipmentUpdate


class Equipment(Base):
    __tablename__ = "equipment"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic information
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Pricing
    price = Column(Float, nullable=False, index=True)
    currency = Column(String(3), default="USD")  # ISO currency codes
    
    # Compliance
    certification = Column(String(50), nullable=False)  # FDA, CE, ISO
    certification_number = Column(String(100), nullable=True)
    certification_expiry = Column(DateTime, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_available = Column(Boolean, default=True, index=True)
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Equipment(id={self.id}, name='{self.name}', category='{self.category}')>"

# Pydantic schemas for API
class EquipmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    price: float = Field(..., gt=0)  # Price must be positive
    currency: str = Field("USD", regex="^[A-Z]{3}$")  # ISO currency format
    certification: str = Field(..., regex="^(FDA|CE|ISO)$")
    certification_number: Optional[str] = None
    certification_expiry: Optional[datetime] = None

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    certification_expiry: Optional[datetime] = None
    is_available: Optional[bool] = None

class EquipmentResponse(EquipmentBase):
    id: int
    is_active: bool
    is_available: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True  # Allows conversion from SQLAlchemy models