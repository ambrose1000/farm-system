

from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
import models, schemas,database
from database import get_db
from datetime import datetime


router = APIRouter(prefix="/livestock", tags=["Livestock"])

# --- Database dependency ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
# routers/livestock.py
@router.post("/", response_model=schemas.LivestockResponse)
def create_livestock(livestock: schemas.LivestockCreate, db: Session = Depends(get_db)):
    """Register new livestock and record initial 'IN' movement."""
    # 1️⃣ Create the livestock record
    db_livestock = models.Livestock(
        tag_number=livestock.tag_number,
        species_id=livestock.species_id,
        category_id=livestock.category_id,
        owner_id=livestock.owner_id,
        location_id=livestock.location_id,
        sex=livestock.sex,
        dob=livestock.dob,
        castrated=livestock.castrated,
        availability="active",
    )
    db.add(db_livestock)
    db.commit()
    db.refresh(db_livestock)

    # 2️⃣ Record registration event
    new_event = models.LivestockEvent(
        livestock_id=db_livestock.id,
        event_type="registered",
        event_date=datetime.utcnow().date(),
        notes="Animal registered in system",
        
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    # 3️⃣ Record initial movement (IN)
    livestock_movement = models.LivestockMovement(
        livestock_id=db_livestock.id,
        movement_type="IN",
        source="registration",
        destination=str(db_livestock.location_id),
        movement_date=datetime.utcnow().date(),
        notes=f"Registered livestock {db_livestock.tag_number}",
    )
    db.add(livestock_movement)
    db.commit()
    db.refresh(livestock_movement)

    # 4️⃣ Prepare latest_event dict for response
    latest_event = {
        "id": new_event.id,
        "livestock_id": new_event.livestock_id,
        "event_type": new_event.event_type,
        "event_date": new_event.event_date,
        "notes": new_event.notes,
    }

    # 5️⃣ Return simplified response
    return schemas.LivestockResponse(
        id=db_livestock.id,
        tag_number=db_livestock.tag_number,
        species_id=db_livestock.species_id,
        category_id=db_livestock.category_id,
        owner_id=db_livestock.owner_id,
        location_id=db_livestock.location_id,
        sex=db_livestock.sex,
        dob=db_livestock.dob,
        castrated=db_livestock.castrated,
        availability=db_livestock.availability,
        latest_event=latest_event,
    )



@router.get("/sires", response_model=List[schemas.LivestockResponse])
def get_sires(db: Session = Depends(database.get_db)):
    """Return active male livestock of category 'Bull' that are currently IN."""
    from sqlalchemy import func

    # Subquery: latest movement for each animal
    latest_movement = (
        db.query(
            models.LivestockMovement.livestock_id,
            func.max(models.LivestockMovement.movement_date).label("latest_date")
        )
        .group_by(models.LivestockMovement.livestock_id)
        .subquery()
    )

    # Main query
    sires = (
        db.query(models.Livestock)
        .join(models.Category, models.Livestock.category_id == models.Category.id)
        .join(
            latest_movement,
            models.Livestock.id == latest_movement.c.livestock_id
        )
        .join(
            models.LivestockMovement,
            (models.LivestockMovement.livestock_id == models.Livestock.id)
            & (models.LivestockMovement.movement_date == latest_movement.c.latest_date)
        )
        .filter(
            models.Livestock.sex == "Male",
            models.Livestock.availability == "active",
            models.Category.name.ilike("%bull%"),
            models.LivestockMovement.movement_type == "IN"
        )
        .all()
    )

    return sires



# 🐄 Dams Endpoint
@router.get("/dams", response_model=List[schemas.LivestockResponse])
def get_dams(db: Session = Depends(database.get_db)):
    """Return active female livestock of category 'Cow' or 'Heifer' that are currently IN."""
    dams = (
        db.query(models.Livestock)
        .join(models.LivestockMovement, models.Livestock.id == models.LivestockMovement.livestock_id)
        .filter(
            models.Livestock.sex == "Female",
            models.Livestock.availability == "active",
            models.LivestockMovement.movement_type == "IN",
        )
        .join(models.Category)
        .filter(models.Category.name.in_(["Cow", "Heifer"]))
        .all()
    )
    return dams

@router.get("/", response_model=List[schemas.LivestockResponse])
def get_all_livestock(
    category: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Livestock)

    if category:
        # look up category ID by name
        category_obj = (
            db.query(models.Category)
            .filter(models.Category.name.ilike(category))  # case-insensitive match
            .first()
        )
        if category_obj:
            query = query.filter(models.Livestock.category_id == category_obj.id)
        else:
            return []  # no such category

    return query.all()
@router.get("/", response_model=List[schemas.LivestockResponse])
def get_available_livestock(db: Session = Depends(get_db)):
    # Only return active animals
    return db.query(models.Livestock).filter(models.Livestock.availability == "active").all()


@router.get("/active/in-movements", response_model=list[schemas.LivestockResponse])
def get_active_livestock_in_movements(db: Session = Depends(get_db)):
    """
    Return livestock that are active AND exist in livestock_movements.
    """
    # Join livestock and livestock_movements
    livestock = (
        db.query(models.Livestock)
        .join(models.LivestockMovement, models.Livestock.id == models.LivestockMovement.livestock_id)
        .filter(models.Livestock.availability == "active")
        .distinct()  # prevent duplicates if multiple movement records exist
        .all()
    )

    if not livestock:
        raise HTTPException(status_code=404, detail="No active livestock found in movements")

    return livestock