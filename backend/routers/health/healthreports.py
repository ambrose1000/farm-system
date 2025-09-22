# routers/healthreports.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
import models, database

router = APIRouter(prefix="/healthreports", tags=["Health Reports"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
@router.get("/event-types")
def get_event_types(db: Session = Depends(get_db)):
    event_types = db.query(models.HealthEventType).all()
    return [{"id": et.id, "name": et.name} for et in event_types]

@router.get("")
def health_report(
    date_from: str = Query(None),
    date_to: str = Query(None),
    event_type_id: int = Query(None),
    db: Session = Depends(get_db),
):
    # Build query for events
    q = (
        db.query(models.HealthEvent)
        .options(
            joinedload(models.HealthEvent.livestock).joinedload(models.Livestock.species),
            joinedload(models.HealthEvent.livestock).joinedload(models.Livestock.owner),
            joinedload(models.HealthEvent.event_type),
            joinedload(models.HealthEvent.disease),
            joinedload(models.HealthEvent.medication),
            joinedload(models.HealthEvent.vet),
        )
    )

    filters = []
    if date_from:
        filters.append(models.HealthEvent.date >= date_from)
    if date_to:
        filters.append(models.HealthEvent.date <= date_to)
    if event_type_id:
        filters.append(models.HealthEvent.event_type_id == event_type_id)

    if filters:
        q = q.filter(and_(*filters))

    events = q.all()

    results = []
    for ev in events:
        livestock = ev.livestock

        # Build animal history (all health events for this animal)
        history_events = (
            db.query(models.HealthEvent)
            .filter(models.HealthEvent.livestock_id == livestock.id)
            .options(
                joinedload(models.HealthEvent.event_type),
                joinedload(models.HealthEvent.disease),
                joinedload(models.HealthEvent.medication),
                joinedload(models.HealthEvent.vet),
            )
            .all()
        )

        history = [
            {
                "date": h.date,
                "event_type_name": h.event_type.name if h.event_type else None,
                "disease_name": h.disease.name if h.disease else None,
                "medication_name": h.medication.name if h.medication else None,
                "vet_name": h.vet.name if h.vet else None,
                "notes": h.notes,
            }
            for h in history_events
        ]

        results.append({
            "id": livestock.id,
            "tag_number": livestock.tag_number,
            "species_name": livestock.species.name if livestock.species else None,
            "owner_name": livestock.owner.name if livestock.owner else None,
            "event_type_name": ev.event_type.name if ev.event_type else None,
            "date": ev.date,
            "history": history,
        })

    return results
