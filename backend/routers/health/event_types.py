from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database

router = APIRouter(prefix="/eventtypes", tags=["Health Event Types"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[schemas.HealthEventType])
def get_event_types(db: Session = Depends(get_db)):
    return db.query(models.HealthEventType).all()

@router.post("/", response_model=schemas.HealthEventType)
def create_event_type(event_type: schemas.HealthEventTypeCreate, db: Session = Depends(get_db)):
    db_event_type = models.HealthEventType(**event_type.dict())
    db.add(db_event_type)
    db.commit()
    db.refresh(db_event_type)
    return db_event_type

@router.put("/{id}", response_model=schemas.HealthEventType)
def update_event_type(id: int, event_type: schemas.HealthEventTypeUpdate, db: Session = Depends(get_db)):
    db_event_type = db.query(models.HealthEventType).filter(models.HealthEventType.id == id).first()
    if not db_event_type:
        raise HTTPException(status_code=404, detail="Event type not found")
    for key, value in event_type.dict(exclude_unset=True).items():
        setattr(db_event_type, key, value)
    db.commit()
    db.refresh(db_event_type)
    return db_event_type

@router.delete("/{id}")
def delete_event_type(id: int, db: Session = Depends(get_db)):
    db_event_type = db.query(models.HealthEventType).filter(models.HealthEventType.id == id).first()
    if not db_event_type:
        raise HTTPException(status_code=404, detail="Event type not found")
    db.delete(db_event_type)
    db.commit()
    return {"detail": "Deleted successfully"}
