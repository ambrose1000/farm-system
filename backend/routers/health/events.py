# routers/health/events.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database

router = APIRouter(prefix="/events", tags=["Health Events"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.HealthEvent])
def list_events(db: Session = Depends(get_db)):
    return db.query(models.HealthEvent).all()

@router.post("/", response_model=schemas.HealthEvent)
def create_event(event: schemas.HealthEventCreate, db: Session = Depends(get_db)):
    db_event = models.HealthEvent(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("/{event_id}", response_model=schemas.HealthEvent)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.HealthEvent).filter(models.HealthEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.put("/{event_id}", response_model=schemas.HealthEvent)
def update_event(event_id: int, updated: schemas.HealthEventUpdate, db: Session = Depends(get_db)):
    db_event = db.query(models.HealthEvent).filter(models.HealthEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    for key, value in updated.dict().items():
        setattr(db_event, key, value)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    db_event = db.query(models.HealthEvent).filter(models.HealthEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(db_event)
    db.commit()
    return {"detail": "Event deleted"}
