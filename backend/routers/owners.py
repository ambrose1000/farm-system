from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database

router = APIRouter(
    prefix="/owners",
    tags=["Owners"]
)

# --- DB dependency ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Create Owner ---
@router.post("/", response_model=schemas.OwnerResponse)
def create_owner(owner: schemas.OwnerCreate, db: Session = Depends(get_db)):
    db_owner = models.Owner(name=owner.name, phone=owner.phone, email=owner.email, address=owner.address)
    db.add(db_owner)
    db.commit()
    db.refresh(db_owner)
    return db_owner

# --- Get all Owners ---
@router.get("/", response_model=List[schemas.OwnerResponse])
def get_owners(db: Session = Depends(get_db)):
    return db.query(models.Owner).all()

# --- Get single Owner by ID ---
@router.get("/{owner_id}", response_model=schemas.OwnerResponse)
def get_owner(owner_id: int, db: Session = Depends(get_db)):
    owner = db.query(models.Owner).filter(models.Owner.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    return owner

# --- Update Owner ---
@router.put("/{owner_id}", response_model=schemas.OwnerResponse)
def update_owner(owner_id: int, updated_owner: schemas.OwnerCreate, db: Session = Depends(get_db)):
    owner = db.query(models.Owner).filter(models.Owner.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    owner.name = updated_owner.name
    owner.phone = updated_owner.phone
    owner.email = updated_owner.email
    owner.address = updated_owner.address

    db.commit()
    db.refresh(owner)
    return owner

# --- Delete Owner ---
@router.delete("/{owner_id}")
def delete_owner(owner_id: int, db: Session = Depends(get_db)):
    owner = db.query(models.Owner).filter(models.Owner.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    db.delete(owner)
    db.commit()
    return {"detail": "Owner deleted successfully"}
