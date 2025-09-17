from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, schemas

router = APIRouter()

# --- Create Location ---
@router.post("/", response_model=schemas.LocationResponse)
def create_location(location: schemas.LocationCreate, db: Session = Depends(database.get_db)):
    db_loc = models.Location(name=location.name)
    db.add(db_loc)
    db.commit()
    db.refresh(db_loc)
    return db_loc

# --- Read all Locations ---
@router.get("/", response_model=list[schemas.LocationResponse])
def get_locations(db: Session = Depends(database.get_db)):
    return db.query(models.Location).all()

# --- Read single Location by ID ---
@router.get("/{location_id}", response_model=schemas.LocationResponse)
def get_location(location_id: int, db: Session = Depends(database.get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return loc

# --- Update Location ---
@router.put("/{location_id}", response_model=schemas.LocationResponse)
def update_location(location_id: int, location: schemas.LocationCreate, db: Session = Depends(database.get_db)):
    db_loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not db_loc:
        raise HTTPException(status_code=404, detail="Location not found")
    db_loc.name = location.name
    db.commit()
    db.refresh(db_loc)
    return db_loc

# --- Delete Location ---
@router.delete("/{location_id}")
def delete_location(location_id: int, db: Session = Depends(database.get_db)):
    db_loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not db_loc:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(db_loc)
    db.commit()
    return {"detail": "Location deleted successfully"}
