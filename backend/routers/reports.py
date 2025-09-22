from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, database

router = APIRouter(prefix="/reports", tags=["Reports"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ================================
# Existing endpoints
# ================================
@router.get("/inventory")
def inventory_report(db: Session = Depends(get_db)):
    total = db.query(func.count(models.Livestock.id)).scalar()

    species_data = (
        db.query(
            models.Species.id.label("species_id"),
            models.Species.name.label("species_name"),
            func.count(models.Livestock.id).label("count"),
        )
        .join(models.Livestock, models.Livestock.species_id == models.Species.id)
        .group_by(models.Species.id, models.Species.name)
        .all()
    )

    owner_data = (
        db.query(
            models.Owner.id.label("owner_id"),
            models.Owner.name.label("owner_name"),
            func.count(models.Livestock.id).label("count"),
        )
        .join(models.Livestock, models.Livestock.owner_id == models.Owner.id)
        .group_by(models.Owner.id, models.Owner.name)
        .all()
    )

    return {
        "total": total or 0,
        "by_species": [dict(row._mapping) for row in species_data],
        "by_owner": [dict(row._mapping) for row in owner_data],
    }


@router.get("/health-events-summary")
def health_events_summary(
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
):
    q = (
        db.query(
            models.HealthEventType.id.label("event_type_id"),
            models.HealthEventType.name.label("event_type_name"),
            func.count(models.HealthEvent.id).label("count"),
        )
        .join(
            models.HealthEvent,
            models.HealthEvent.event_type_id == models.HealthEventType.id
        )
    )

    if date_from:
        q = q.filter(models.HealthEvent.date >= date_from)
    if date_to:
        q = q.filter(models.HealthEvent.date <= date_to)

    q = q.group_by(models.HealthEventType.id, models.HealthEventType.name).all()
    return [dict(row._mapping) for row in q]


@router.get("/disease-incidence")
def disease_incidence(
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
):
    q = (
        db.query(
            models.Disease.id.label("disease_id"),
            models.Disease.name.label("disease_name"),
            func.count(models.HealthEvent.id).label("count"),
        )
        .join(models.HealthEvent, models.HealthEvent.disease_id == models.Disease.id)
        .filter(models.HealthEvent.disease_id.isnot(None))
    )

    if date_from:
        q = q.filter(models.HealthEvent.date >= date_from)
    if date_to:
        q = q.filter(models.HealthEvent.date <= date_to)

    q = q.group_by(models.Disease.id, models.Disease.name).all()
    return [dict(row._mapping) for row in q]


# ================================
# New: Health report endpoints
# ================================
@router.get("/health-report")
def health_report(
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns:
      - total_sick: number of animals with disease events
      - sick_animals: list of livestock with disease info
    """
    q = (
        db.query(
            models.Livestock.id.label("livestock_id"),
            models.Livestock.tag_number.label("tag_number"),
            models.Species.name.label("species"),
            models.Owner.name.label("owner"),
            models.Disease.name.label("disease"),
            models.HealthEvent.date.label("event_date"),
            models.HealthEvent.notes.label("notes"),
        )
        .join(models.HealthEvent, models.HealthEvent.livestock_id == models.Livestock.id)
        .join(models.Disease, models.HealthEvent.disease_id == models.Disease.id)
        .join(models.Species, models.Livestock.species_id == models.Species.id)
        .join(models.Owner, models.Livestock.owner_id == models.Owner.id)
    )

    if date_from:
        q = q.filter(models.HealthEvent.date >= date_from)
    if date_to:
        q = q.filter(models.HealthEvent.date <= date_to)

    sick_animals = [dict(row._mapping) for row in q.all()]
    return {
        "total_sick": len(sick_animals),
        "sick_animals": sick_animals,
    }


@router.get("/health-report")
def health_report(
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns:
      - total_sick: number of animals with health events
      - sick_animals: list of livestock with disease info (if available)
    """
    q = (
        db.query(
            models.Livestock.id.label("livestock_id"),
            models.Livestock.tag_number.label("tag_number"),
            models.Species.name.label("species"),
            models.Owner.name.label("owner"),
            models.Disease.name.label("disease"),
            models.HealthEvent.date.label("event_date"),
            models.HealthEvent.notes.label("notes"),
        )
        .join(models.HealthEvent, models.HealthEvent.livestock_id == models.Livestock.id)
        .outerjoin(models.Disease, models.HealthEvent.disease_id == models.Disease.id)  # 👈 outer join, disease optional
        .join(models.Species, models.Livestock.species_id == models.Species.id)
        .join(models.Owner, models.Livestock.owner_id == models.Owner.id)
    )

    if date_from:
        q = q.filter(models.HealthEvent.date >= date_from)
    if date_to:
        q = q.filter(models.HealthEvent.date <= date_to)

    animals = [dict(row._mapping) for row in q.all()]

    return {
        "total_sick": len(animals),
        "sick_animals": animals,
    }
@router.get("/health-report")
def health_report(
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns:
      - total_sick: number of animals with health events
      - sick_animals: list of livestock with disease info (if available)
    """
    q = (
        db.query(
            models.Livestock.id.label("livestock_id"),
            models.Livestock.tag_number.label("tag_number"),
            models.Species.name.label("species"),
            models.Owner.name.label("owner"),
            models.Disease.name.label("disease"),
            models.HealthEvent.date.label("event_date"),
            models.HealthEvent.notes.label("notes"),
        )
        .join(models.HealthEvent, models.HealthEvent.livestock_id == models.Livestock.id)
        .outerjoin(models.Disease, models.HealthEvent.disease_id == models.Disease.id)  # 👈 outer join, disease optional
        .join(models.Species, models.Livestock.species_id == models.Species.id)
        .join(models.Owner, models.Livestock.owner_id == models.Owner.id)
    )

    if date_from:
        q = q.filter(models.HealthEvent.date >= date_from)
    if date_to:
        q = q.filter(models.HealthEvent.date <= date_to)

    animals = [dict(row._mapping) for row in q.all()]

    return {
        "total_sick": len(animals),
        "sick_animals": animals,
    }
