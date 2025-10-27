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

        # 🚨 Prevent duplicate exits
        if livestock.availability == "inactive":
            raise HTTPException(
                status_code=400,
                detail=f"Livestock {livestock.tag_number} already inactive (slaughtered/dead)."
            )

        # Step 2: Create Exit record
        new_exit = models.Exit(
            livestock_id=livestock.id,
            exit_type=exit.exit_type,
            reason=exit.reason,
        )
        db.add(new_exit)
        db.flush()  # get ID before commit

        # Step 3: Deactivate livestock
        livestock.availability = "inactive"
        db.flush()

        # Step 4: Record Livestock Event
        event = models.LivestockEvent(
            livestock_id=livestock.id,
            event_type=exit.exit_type,  # "slaughter" or "death"
            event_date=datetime.utcnow(),
            related_id=new_exit.id,
            notes=f"Exit recorded: {exit.reason}"
        )
        db.add(event)
        db.flush()

        # Step 5: Record Livestock Movement (OUT)
        movement = models.LivestockMovement(
            livestock_id=livestock.id,
            movement_type="OUT",
            source="farm",
            destination="slaughter" if exit.exit_type == "slaughter" else "disposal",
            movement_date=datetime.utcnow(),
            notes=f"Livestock exited via {exit.exit_type} (exit ID {new_exit.id})"
        )
        db.add(movement)

        # Step 6: Commit once (atomic)
        db.commit()
        db.refresh(new_exit)
        db.refresh(event)

        # Step 7: Return structured response
        return schemas.ExitResponse(
            id=new_exit.id,
            livestock_id=new_exit.livestock_id,
            exit_type=new_exit.exit_type,
            reason=new_exit.reason,
            created_at=new_exit.created_at,
            latest_event={
                "id": event.id,
                "livestock_id": event.livestock_id,
                "event_type": event.event_type,
                "event_date": event.event_date,
                "related_id": event.related_id,
                "notes": event.notes,
            },
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

