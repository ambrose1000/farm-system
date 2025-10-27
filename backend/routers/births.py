# routers/births.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas

from database import get_db 
from typing import List


router = APIRouter(prefix="/births", tags=["Births"])
@router.post("/", response_model=schemas.BirthResponse)
def record_birth(birth: schemas.BirthCreate, db: Session = Depends(get_db)):
    try:
        # Step 1: Validate dam
        dam = db.query(models.Livestock).filter(models.Livestock.id == birth.dam_id).first()
        if not dam:
            raise HTTPException(status_code=400, detail="Invalid dam_id")

        # Step 2: Get 'Calf' category
        calf_category = db.query(models.Category).filter(models.Category.name.ilike("Calf")).first()
        if not calf_category:
            raise HTTPException(status_code=400, detail="Category 'Calf' not found. Please create it first.")

        # Step 3: Create calf (always in 'Calf' category)
        calf = models.Livestock(
            tag_number=birth.tag_number,
            species_id=dam.species_id,
            category_id=calf_category.id,  # 👈 force category to 'Calf'
            owner_id=dam.owner_id,
            location_id=dam.location_id,
            sex=birth.sex,
            dob=birth.birth_date,
            availability="active",
            origin="birth"
        )
        db.add(calf)
        db.flush()  # get calf.id before commit

        # Step 4: Record parentage
        parentage = models.Parentage(
            calf_id=calf.id,
            sire_id=birth.sire_id,
            dam_id=birth.dam_id,
            notes=birth.notes
        )
        db.add(parentage)
        db.flush()

        # Step 5: Birth record
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

        # Step 6: Event log
        birth_event = models.LivestockEvent(
            livestock_id=calf.id,
            event_type="birth",
            event_date=birth.birth_date,
            notes=f"Birth recorded for calf {calf.tag_number}"
        )
        db.add(birth_event)
        db.flush()

        # Step 7: Auto livestock movement
        livestock_movement = models.LivestockMovement(
            livestock_id=calf.id,
            movement_type="IN",
            source="birth",
            destination=calf.location_id,
            movement_date=birth.birth_date,
            notes="New animal born — added to herd"
        )
        db.add(livestock_movement)

        # ✅ Step 8: Commit all together
        db.commit()
        db.refresh(calf)
        db.refresh(birth_event)

        # Step 9: Response
        event_response = {
            "id": birth_event.id,
            "livestock_id": birth_event.livestock_id,
            "event_type": birth_event.event_type,
            "event_date": birth_event.event_date,
            "notes": birth_event.notes,
        }

        return schemas.BirthResponse(
            id=parentage.id,
            tag_number=calf.tag_number,
            dob=calf.dob,
            sex=calf.sex,
            notes=parentage.notes,
            sire={"id": birth.sire_id} if birth.sire_id else None,
            dam={"id": birth.dam_id} if birth.dam_id else None,
            latest_event=event_response
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error recording birth: {str(e)}")


@router.get("/", response_model=List[schemas.BirthResponse])
def get_all_births(db: Session = Depends(get_db)):
    births = (
        db.query(models.Birth)
        .order_by(models.Birth.dob.desc())
        .all()
    )

    response = []
    for b in births:
        # get linked livestock (calf) by tag_number
        calf = (
            db.query(models.Livestock)
            .filter(models.Livestock.tag_number == b.tag_number)
            .first()
        )

        # get last event for this calf (if any)
        latest_event = (
            db.query(models.LivestockEvent)
            .filter(models.LivestockEvent.livestock_id == calf.id)
            .order_by(models.LivestockEvent.event_date.desc())
            .first()
            if calf
            else None
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
                sire={"id": b.sire_id} if b.sire_id else None,
                dam={"id": b.dam_id} if b.dam_id else None,
                latest_event=event_data,
            )
        )

    return response

