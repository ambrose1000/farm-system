# routers/exit.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
import models, schemas
from database import get_db
from datetime import datetime 

router = APIRouter(prefix="/livestock/exit", tags=["Livestock Exit"])

# Hardcoded exit types in backend
EXIT_TYPES = ["death", "slaughter"]
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas, database

router = APIRouter(prefix="/exits", tags=["Exits"])

@router.post("/", response_model=schemas.ExitResponse)
def record_exit(exit: schemas.ExitCreate, db: Session = Depends(database.get_db)):
    try:
        # Step 1: Find livestock
        livestock = db.query(models.Livestock).filter(
            models.Livestock.tag_number == exit.tag_number
        ).first()
        if not livestock:
            raise HTTPException(status_code=404, detail="Livestock not found")

        if livestock.availability == "inactive":
            raise HTTPException(
                status_code=400,
                detail=f"Livestock {livestock.tag_number} already inactive."
            )

        # Step 2: Create exit record
        db_exit = models.Exit(
            livestock_id=livestock.id,
            exit_type=exit.exit_type,
            reason=exit.reason
            # created_at auto set
        )
        db.add(db_exit)
        db.flush()

        # Step 3: Deactivate livestock
        livestock.availability = "inactive"
        db.flush()

        # Step 4: Create livestock event using created_at as event date
        event = models.LivestockEvent(
            livestock_id=livestock.id,
            event_type=exit.exit_type,
            event_date=db_exit.created_at,  # <-- using created_at
            exit_id=db_exit.id,
            notes=f"Exit recorded: {exit.reason}"
        )
        db.add(event)
        db.flush()

        # Step 5: Out Movement
        movement = models.LivestockMovement(
            livestock_id=livestock.id,
            movement_type="OUT",
            source="farm",
            destination="slaughter" if exit.exit_type == "slaughter" else "disposal",
            movement_date=db_exit.created_at,
            notes=f"Livestock exited via {exit.exit_type} (exit ID {db_exit.id})"
        )
        db.add(movement)

        # Final Commit
        db.commit()
        db.refresh(db_exit)
        db.refresh(event)

        return schemas.ExitResponse(
            id=db_exit.id,
            livestock_id=db_exit.livestock_id,
            exit_type=db_exit.exit_type,
            reason=db_exit.reason,
            created_at=db_exit.created_at,
            latest_event={
                "id": event.id,
                "livestock_id": event.livestock_id,
                "event_type": event.event_type,
                "event_date": event.event_date,
                "exit_id": event.exit_id,
                "notes": event.notes
            }
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error recording exit: {str(e)}")





@router.get("/", response_model=List[schemas.ExitResponse])
def get_all_exits(db: Session = Depends(get_db)):
    exits = db.query(models.Exit).all()
    response = []

    for e in exits:
        animal = db.query(models.Livestock).filter(models.Livestock.id == e.livestock_id).first()
        event = db.query(models.LivestockEvent).filter(
            models.LivestockEvent.livestock_id == e.livestock_id,
            models.LivestockEvent.event_type == e.exit_type
        ).order_by(models.LivestockEvent.event_date.desc()).first()

        response.append({
            "id": e.id,
            "livestock_id": e.livestock_id,
            "livestock_tag": animal.tag_number if animal else None,
            "exit_type": e.exit_type,
            "event_date": event.event_date if event else None,
            "notes": event.notes if event else None,
            "reason": getattr(e, "reason", e.exit_type),  # or hardcode e.exit_type
            "created_at": getattr(e, "created_at", event.event_date if event else None)
        })

    return response

