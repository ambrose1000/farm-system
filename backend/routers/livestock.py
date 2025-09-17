from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import models, schemas, database

router = APIRouter(prefix="/livestock", tags=["Livestock"])

# --- Database dependency ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ✅ Create Livestock
@router.post("/", response_model=schemas.LivestockResponse)
def create_livestock(livestock: schemas.LivestockCreate, db: Session = Depends(get_db)):
    db_livestock = models.Livestock(**livestock.dict())
    try:
        db.add(db_livestock)
        db.commit()
        db.refresh(db_livestock)
        return db_livestock
    except IntegrityError as e:
        db.rollback()
        if "livestock_tag_number_key" in str(e.orig):
            raise HTTPException(status_code=400, detail="Tag number already exists")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ✅ Get all livestock
@router.get("/", response_model=List[schemas.LivestockResponse])
def get_all_livestock(db: Session = Depends(get_db)):
    return db.query(models.Livestock).all()


# ✅ Get single livestock by ID
@router.get("/{id}", response_model=schemas.LivestockResponse)
def get_livestock(id: int, db: Session = Depends(get_db)):
    livestock = db.query(models.Livestock).filter(models.Livestock.id == id).first()
    if not livestock:
        raise HTTPException(status_code=404, detail="Livestock not found")
    return livestock


# ✅ Update livestock
@router.put("/{id}", response_model=schemas.LivestockResponse)
def update_livestock(id: int, updated: schemas.LivestockCreate, db: Session = Depends(get_db)):
    livestock = db.query(models.Livestock).filter(models.Livestock.id == id).first()
    if not livestock:
        raise HTTPException(status_code=404, detail="Livestock not found")

    for key, value in updated.dict().items():
        setattr(livestock, key, value)

    db.commit()
    db.refresh(livestock)
    return livestock


# ✅ Delete livestock
@router.delete("/{id}")
def delete_livestock(id: int, db: Session = Depends(get_db)):
    livestock = db.query(models.Livestock).filter(models.Livestock.id == id).first()
    if not livestock:
        raise HTTPException(status_code=404, detail="Livestock not found")

    db.delete(livestock)
    db.commit()
    return {"message": "Livestock deleted successfully"}
