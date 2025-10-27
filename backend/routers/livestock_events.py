from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database

router = APIRouter(prefix="/livestock-events", tags=["Livestock Events"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Create Event ---
@router.post("/", response_model=schemas.LivestockEventResponse)
def create_event(event: schemas.LivestockEventCreate, db: Session = Depends(get_db)):
    # 1️⃣ Make sure the livestock exists
    livestock = db.query(models.Livestock).filter(models.Livestock.id == event.livestock_id).first()
    if not livestock:
        raise HTTPException(status_code=404, detail="Livestock not found")

    # 2️⃣ Create the event record
    db_event = models.LivestockEvent(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    # 3️⃣ Automatically handle inventory update
    try:
        from crud.inventory import handle_livestock_inventory_event
        handle_livestock_inventory_event(db, db_event)
    except Exception as e:
        print(f"[Inventory Sync Error] {e}")
        # optionally log this error, but don’t break event creation

    # 4️⃣ Return the event
    return db_event


# --- Get All Events for One Livestock ---
@router.get("/livestock/{livestock_id}", response_model=List[schemas.LivestockEventResponse])
def get_events_for_livestock(livestock_id: int, db: Session = Depends(get_db)):
    livestock = db.query(models.Livestock).filter(models.Livestock.id == livestock_id).first()
    if not livestock:
        raise HTTPException(status_code=404, detail="Livestock not found")

    return db.query(models.LivestockEvent).filter(models.LivestockEvent.livestock_id == livestock_id).all()


# --- Get Single Event ---
@router.get("/{event_id}", response_model=schemas.LivestockEventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.LivestockEvent).filter(models.LivestockEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
# --- Get All Livestock Events ---
@router.get("/", response_model=List[schemas.LivestockEventResponse])
def get_all_events(db: Session = Depends(get_db)):
    return db.query(models.LivestockEvent).all()
