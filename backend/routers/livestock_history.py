from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
import models, schemas

router = APIRouter(
    prefix="/livestock-history",
    tags=["Livestock History"]
)

@router.get("/", response_model=list[schemas.LivestockHistoryResponse])
def get_all_livestock_history(db: Session = Depends(get_db)):
    """
    Return all livestock with their events, movements, and status.
    """
    livestock_list = (
        db.query(models.Livestock)
        .options(
            joinedload(models.Livestock.events),
            joinedload(models.Livestock.movements),
        )
        .all()
    )

    result = []
    for animal in livestock_list:
        events = sorted(animal.events, key=lambda e: e.event_date)
        moves = sorted(animal.movements, key=lambda m: m.movement_date)

        last_move = moves[-1] if moves else None
        last_event = events[-1] if events else None

        result.append({
            "id": animal.id,
            "tag_number": animal.tag_number,
            "species_id": animal.species_id,
            "category_id": animal.category_id,
            "owner_id": animal.owner_id,
            "availability": animal.availability,
            "status": animal.availability,
            "last_movement": {
                "movement_type": last_move.movement_type if last_move else None,
                "movement_date": last_move.movement_date if last_move else None,
                "source": last_move.source if last_move else None,
                "destination": last_move.destination if last_move else None,
            } if last_move else None,
            "last_event": {
                "event_type": last_event.event_type if last_event else None,
                "event_date": last_event.event_date if last_event else None,
                "notes": last_event.notes if last_event else None,
            } if last_event else None,
            "events": [
                {
                    "event_type": ev.event_type,
                    "event_date": ev.event_date,
                    "notes": ev.notes,
                }
                for ev in events
            ],
            "movements": [
                {
                    "movement_type": mv.movement_type,
                    "movement_date": mv.movement_date,
                    "source": mv.source,
                    "destination": mv.destination,
                    "notes": mv.notes,
                }
                for mv in moves
            ],
        })

    return result


@router.get("/{tag_number}", response_model=schemas.LivestockHistoryResponse)
def get_livestock_history_by_tag(tag_number: str, db: Session = Depends(get_db)):
    """
    Return full history for a specific tag number.
    """
    animal = (
        db.query(models.Livestock)
        .filter(models.Livestock.tag_number == tag_number)
        .options(
            joinedload(models.Livestock.events),
            joinedload(models.Livestock.movements),
        )
        .first()
    )

    if not animal:
        raise HTTPException(status_code=404, detail=f"Livestock {tag_number} not found")

    events = sorted(animal.events, key=lambda e: e.event_date)
    moves = sorted(animal.movements, key=lambda m: m.movement_date)

    last_move = moves[-1] if moves else None
    last_event = events[-1] if events else None

    return {
        "id": animal.id,
        "tag_number": animal.tag_number,
        "species_id": animal.species_id,
        "category_id": animal.category_id,
        "owner_id": animal.owner_id,
        "availability": animal.availability,
        "status": animal.availability,
        "last_movement": {
            "movement_type": last_move.movement_type if last_move else None,
            "movement_date": last_move.movement_date if last_move else None,
            "source": last_move.source if last_move else None,
            "destination": last_move.destination if last_move else None,
        } if last_move else None,
        "last_event": {
            "event_type": last_event.event_type if last_event else None,
            "event_date": last_event.event_date if last_event else None,
            "notes": last_event.notes if last_event else None,
        } if last_event else None,
        "events": [
            {
                "event_type": ev.event_type,
                "event_date": ev.event_date,
                "notes": ev.notes,
            }
            for ev in events
        ],
        "movements": [
            {
                "movement_type": mv.movement_type,
                "movement_date": mv.movement_date,
                "source": mv.source,
                "destination": mv.destination,
                "notes": mv.notes,
            }
            for mv in moves
        ],
    }
@router.get("/summary")
def livestock_summary(db: Session = Depends(get_db)):
    """
    Returns livestock summary: totals, species, categories, owners, availability.
    """

    # Total livestock
    total = db.query(func.count(models.Livestock.id)).scalar()

    # Availability breakdown
    availability_data = (
        db.query(models.Livestock.availability, func.count(models.Livestock.id))
        .group_by(models.Livestock.availability)
        .all()
    )
    availability = {row[0]: row[1] for row in availability_data}

    # Species breakdown
    species_data = (
        db.query(models.Livestock.species_id, func.count(models.Livestock.id))
        .group_by(models.Livestock.species_id)
        .all()
    )
    species = {str(row[0]): row[1] for row in species_data}

    # Category breakdown
    category_data = (
        db.query(models.Livestock.category_id, func.count(models.Livestock.id))
        .group_by(models.Livestock.category_id)
        .all()
    )
    categories = {str(row[0]): row[1] for row in category_data}

    # Owner breakdown
    owner_data = (
        db.query(models.Livestock.owner_id, func.count(models.Livestock.id))
        .group_by(models.Livestock.owner_id)
        .all()
    )
    owners = {str(row[0]): row[1] for row in owner_data}

    return {
        "total_livestock": total,
        "availability": availability,
        "species": species,
        "categories": categories,
        "owners": owners,
    }
