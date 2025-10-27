# routers/health/events.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
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
    # 1️⃣ Create and save health event
    db_event = models.HealthEvent(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    # 2️⃣ Get readable event type name
    event_type_name = None
    if db_event.event_type_id:
        type_obj = db.query(models.HealthEventType).filter(models.HealthEventType.id == db_event.event_type_id).first()
        event_type_name = type_obj.name if type_obj else "Health"

    # 3️⃣ Prepare descriptive notes
    notes_parts = []
    if db_event.disease_id:
        disease = db.query(models.Disease).filter(models.Disease.id == db_event.disease_id).first()
        if disease:
            notes_parts.append(f"Disease: {disease.name}")
    if db_event.medication_id:
        medication = db.query(models.Medication).filter(models.Medication.id == db_event.medication_id).first()
        if medication:
            notes_parts.append(f"Medication: {medication.name}")
    if db_event.vet_id:
        vet = db.query(models.Vet).filter(models.Vet.id == db_event.vet_id).first()
        if vet:
            notes_parts.append(f"Vet: {vet.name}")
    if db_event.notes:
        notes_parts.append(f"Notes: {db_event.notes}")

    combined_notes = "; ".join(notes_parts) if notes_parts else "Health event recorded."

    # 4️⃣ Create livestock event record
    livestock_event = models.LivestockEvent(
        livestock_id=db_event.livestock_id,
        event_type=event_type_name or "Health",
        event_date=db_event.date or datetime.utcnow().date(),
        notes=combined_notes,
        related_id=db_event.id,
        created_at=datetime.utcnow(),
    )
    db.add(livestock_event)
    db.commit()

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

    # Optionally, also update livestock_events entry if related
    livestock_event = (
        db.query(models.LivestockEvent)
        .filter(models.LivestockEvent.related_id == db_event.id, models.LivestockEvent.event_type == "Health")
        .first()
    )
    if livestock_event:
        livestock_event.event_date = db_event.date
        livestock_event.notes = db_event.notes
        db.commit()

    return db_event


@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    db_event = db.query(models.HealthEvent).filter(models.HealthEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    # delete related livestock event too
    db_livestock_event = (
        db.query(models.LivestockEvent)
        .filter(models.LivestockEvent.related_id == event_id, models.LivestockEvent.event_type == "Health")
        .first()
    )
    if db_livestock_event:
        db.delete(db_livestock_event)

    db.delete(db_event)
    db.commit()
    return {"detail": "Health event and linked livestock event deleted"}
