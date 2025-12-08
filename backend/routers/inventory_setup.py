from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter(prefix="/inventory-setup", tags=["Inventory Setup"])


# 🧱 1️⃣ Inventory Types
@router.get("/types", response_model=List[schemas.InventoryTypeResponse])
def get_inventory_types(db: Session = Depends(get_db)):
    """Fetch all inventory types (e.g., Medicine, Feed, Equipment)"""
    return db.query(models.InventoryType).order_by(models.InventoryType.id.desc()).all()


@router.post("/types", response_model=schemas.InventoryTypeResponse)
def create_inventory_type(type_data: schemas.InventoryTypeCreate, db: Session = Depends(get_db)):
    """Create a new inventory type"""
    existing = db.query(models.InventoryType).filter(
        models.InventoryType.name.ilike(type_data.name)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Inventory type already exists")

    new_type = models.InventoryType(**type_data.dict())
    db.add(new_type)
    db.commit()
    db.refresh(new_type)
    return new_type


@router.put("/types/{type_id}", response_model=schemas.InventoryTypeResponse)
def update_inventory_type(type_id: int, type_data: schemas.InventoryTypeCreate, db: Session = Depends(get_db)):
    """Update an existing inventory type"""
    db_type = db.query(models.InventoryType).filter(models.InventoryType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Inventory type not found")

    db_type.name = type_data.name
    db_type.description = type_data.description
    db.commit()
    db.refresh(db_type)
    return db_type


@router.delete("/types/{type_id}")
def delete_inventory_type(type_id: int, db: Session = Depends(get_db)):
    """Delete an inventory type"""
    db_type = db.query(models.InventoryType).filter(models.InventoryType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Inventory type not found")

    db.delete(db_type)
    db.commit()
    return {"message": "Inventory type deleted successfully"}


# ⚖️ 2️⃣ Units of Measure
@router.get("/units", response_model=List[schemas.UnitResponse])
def get_units(db: Session = Depends(get_db)):
    """Fetch all units of measure"""
    return db.query(models.Unit).order_by(models.Unit.id.desc()).all()


@router.post("/units", response_model=schemas.UnitResponse)
def create_unit(unit_data: schemas.UnitCreate, db: Session = Depends(get_db)):
    """Create a new unit of measure"""
    existing = db.query(models.Unit).filter(models.Unit.name.ilike(unit_data.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Unit already exists")

    new_unit = models.Unit(**unit_data.dict())
    db.add(new_unit)
    db.commit()
    db.refresh(new_unit)
    return new_unit


@router.put("/units/{unit_id}", response_model=schemas.UnitResponse)
def update_unit(unit_id: int, unit_data: schemas.UnitCreate, db: Session = Depends(get_db)):
    """Update a unit of measure"""
    db_unit = db.query(models.Unit).filter(models.Unit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    db_unit.name = unit_data.name
    db_unit.abbreviation = unit_data.abbreviation
    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.delete("/units/{unit_id}")
def delete_unit(unit_id: int, db: Session = Depends(get_db)):
    """Delete a unit of measure"""
    db_unit = db.query(models.Unit).filter(models.Unit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    db.delete(db_unit)
    db.commit()
    return {"message": "Unit deleted successfully"}
