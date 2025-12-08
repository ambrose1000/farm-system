# routers/births.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db 
from typing import List

router = APIRouter(prefix="/births", tags=["Births"])

# -----------------------------------------------------------
# ✅ CREATE BIRTH (NO PARENTS REQUIRED NOW)
# -----------------------------------------------------------
@router.post("/", response_model=schemas.BirthResponse)
def record_birth(birth: schemas.BirthCreate, db: Session = Depends(get_db)):
    try:
        # Step 1: Ensure tag_number is unique
        existing = db.query(models.Livestock).filter(
            models.Livestock.tag_number == birth.tag_number
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Tag number already exists")

        # Step 2: Ensure species exists
        species = db.query(models.Species).filter(models.Species.id == birth.species_id).first()
        if not species:
            raise HTTPException(status_code=404, detail="Species not found")

        # Step 3: Ensure Calf category exists OR auto-create
        calf_category = db.query(models.Category).filter(
            models.Category.name.ilike("Calf"),
            models.Category.species_id == birth.species_id
        ).first()

        if not calf_category:
            calf_category = models.Category(
                name="Calf",
                species_id=birth.species_id
            )
            db.add(calf_category)
            db.flush()

        # Step 4: Create the calf livestock record
        calf = models.Livestock(
            tag_number=birth.tag_number,
            sex=birth.sex,
            dob=birth.birth_date,
            species_id=birth.species_id,
            category_id=calf_category.id,
            owner_id=birth.owner_id,
            location_id=birth.location_id,
            availability="active",
            origin="birth"
        )
        db.add(calf)
        db.flush()

        # Step 5: Create birth record with parents
        birth_record = models.Birth(
            tag_number=calf.tag_number,
            dob=calf.dob,
            sex=calf.sex,
            sire_id=birth.sire_id,
            dam_id=birth.dam_id,
            notes=birth.notes
        )
        db.add(birth_record)
        db.flush()

        # Step 6: Birth event
        birth_event = models.LivestockEvent(
            livestock_id=calf.id,
            event_type="birth",
            event_date=birth.birth_date,
            notes=f"Birth recorded for calf {calf.tag_number}"
        )
        db.add(birth_event)
        db.flush()

        # Step 7: Movement (IN)
        livestock_movement = models.LivestockMovement(
            livestock_id=calf.id,
            movement_type="IN",
            source="birth",
            destination=birth.location_id,
            movement_date=birth.birth_date,
            notes="Calf born and added to herd"
        )
        db.add(livestock_movement)

        db.commit()

        return schemas.BirthResponse(
            id=birth_record.id,
            tag_number=calf.tag_number,
            dob=calf.dob,
            sex=calf.sex,
            sire_id=birth.sire_id,
            dam_id=birth.dam_id,
            notes=birth.notes,
            latest_event={
                "id": birth_event.id,
                "livestock_id": birth_event.livestock_id,
                "event_type": birth_event.event_type,
                "event_date": birth_event.event_date,
                "notes": birth_event.notes,
            }
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error recording birth: {str(e)}")



# -----------------------------------------------------------
# 🔍 GET ALL BIRTHS
# -----------------------------------------------------------
@router.get("/", response_model=List[schemas.BirthResponse])
def get_all_births(db: Session = Depends(get_db)):
    births = db.query(models.Birth).order_by(models.Birth.dob.desc()).all()
    response = []

    for b in births:
        calf = (
            db.query(models.Livestock)
            .filter(models.Livestock.tag_number == b.tag_number)
            .first()
        )

        latest_event = (
            db.query(models.LivestockEvent)
            .filter(models.LivestockEvent.livestock_id == calf.id)
            .order_by(models.LivestockEvent.event_date.desc())
            .first()
            if calf else None
        )

        event_data = None
        if latest_event:
            event_data = {
                "id": latest_event.id,
                "livestock_id": latest_event.livestock_id,
                "event_type": latest_event.event_type,
                "event_date": latest_event.event_date,
                "notes": latest_event.notes,
            }

        response.append(
            schemas.BirthResponse(
                id=b.id,
                tag_number=b.tag_number,
                dob=b.dob,
                sex=b.sex,
                notes=b.notes,
                sire=None if not b.sire_id else {"id": b.sire_id},
                dam=None if not b.dam_id else {"id": b.dam_id},
                latest_event=event_data
            )
        )

    return response
