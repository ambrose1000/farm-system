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


# -------------------------------------------------------
# GET ALL HEALTH EVENTS
# -------------------------------------------------------
@router.get("/", response_model=List[schemas.HealthEvent])
def list_events(db: Session = Depends(get_db)):
    return db.query(models.HealthEvent).all()


# -------------------------------------------------------
# CREATE HEALTH EVENT + LINK LIVESTOCK_EVENT
# -------------------------------------------------------
@router.post("/", response_model=schemas.HealthEvent)
def create_event(event: schemas.HealthEventCreate, db: Session = Depends(get_db)):

    # 1️⃣ Create and save health event
    db_event = models.HealthEvent(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    # 2️⃣ Build readable event name
    event_type_obj = db.query(models.HealthEventType).filter(
        models.HealthEventType.id == db_event.event_type_id
    ).first()
    event_type_name = event_type_obj.name if event_type_obj else "Health"

    # 3️⃣ Build notes string
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

    # 4️⃣ Record linked LivestockEvent
    livestock_event = models.LivestockEvent(
        livestock_id=db_event.livestock_id,
        event_type="health",  # always lowercase for consistency
        event_date=db_event.date,
        notes=combined_notes,
        health_event_id=db_event.id,        # <-- LINK HEALTH EVENT HERE
        created_at=datetime.utcnow(),
    )
    db.add(livestock_event)

    db.commit()

    return db_event


# -------------------------------------------------------
# GET SINGLE HEALTH EVENT
# -------------------------------------------------------
@router.get("/{event_id}", response_model=schemas.HealthEvent)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.HealthEvent).filter(models.HealthEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


# -------------------------------------------------------
# UPDATE HEALTH EVENT + UPDATE LINKED LIVESTOCK EVENT
# -------------------------------------------------------
@router.put("/{event_id}", response_model=schemas.HealthEvent)
def update_event(event_id: int, updated: schemas.HealthEventUpdate, db: Session = Depends(get_db)):
    db_event = db.query(models.HealthEvent).filter(models.HealthEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Apply updates
    for key, value in updated.dict(exclude_unset=True).items():
        setattr(db_event, key, value)

    db.commit()
    db.refresh(db_event)

    # Update livestock_event
    livestock_event = (
        db.query(models.LivestockEvent)
        .filter(models.LivestockEvent.health_event_id == db_event.id)
        .first()
    )

    if livestock_event:
        livestock_event.event_date = db_event.date
        livestock_event.notes = db_event.notes or livestock_event.notes
        db.commit()

    return db_event


# -------------------------------------------------------
# DELETE HEALTH EVENT + DELETE LINKED LIVESTOCK EVENT
# -------------------------------------------------------
@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    db_event = db.query(models.HealthEvent).filter(models.HealthEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Delete related livestock event
    linked = (
        db.query(models.LivestockEvent)
        .filter(models.LivestockEvent.health_event_id == event_id)
        .first()
    )
    if linked:
        db.delete(linked)

    db.delete(db_event)
    db.commit()

    return {"detail": "Health event and linked livestock event deleted"}
