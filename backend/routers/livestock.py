from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime
import pandas as pd
import io

import models, schemas, database

router = APIRouter(prefix="/livestock", tags=["Livestock"])

# --- Database dependency ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ----------------------------------------------
# 🐄 Register single livestock
# ----------------------------------------------
@router.post("/", response_model=schemas.LivestockResponse)
def create_livestock(livestock: schemas.LivestockCreate, db: Session = Depends(get_db)):
    """Register new livestock and record initial 'IN' movement."""
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

    event = models.LivestockEvent(
        livestock_id=db_livestock.id,
        event_type="registered",
        event_date=datetime.utcnow().date(),
        notes="Animal registered in system",
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    move = models.LivestockMovement(
        livestock_id=db_livestock.id,
        movement_type="IN",
        source="registration",
        destination=str(db_livestock.location_id),
        movement_date=datetime.utcnow().date(),
        notes=f"Registered livestock {db_livestock.tag_number}",
    )
    db.add(move)
    db.commit()
    db.refresh(move)

    latest_event = {
        "id": event.id,
        "livestock_id": event.livestock_id,
        "event_type": event.event_type,
        "event_date": event.event_date,
        "notes": event.notes,
    }

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


# ----------------------------------------------
# 🐄 Get all livestock (dashboard)
# ----------------------------------------------
@router.get("/", response_model=List[schemas.LivestockResponse])
def get_all_livestock(
    available: Optional[bool] = Query(None, description="Filter only active livestock if true"),
    category: Optional[str] = Query(None, description="Filter by category name"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Livestock)

    if available is True:
        query = query.filter(models.Livestock.availability == "active")
    elif available is False:
        query = query.filter(models.Livestock.availability != "active")

    if category:
        category_obj = db.query(models.Category).filter(models.Category.name.ilike(category)).first()
        if category_obj:
            query = query.filter(models.Livestock.category_id == category_obj.id)
        else:
            return []  # no such category

    return query.all()


# ----------------------------------------------
# 🐄 Get sires (active bulls)
# ----------------------------------------------
@router.get("/sires", response_model=List[schemas.LivestockResponse])
def get_sires(db: Session = Depends(get_db)):
    from sqlalchemy import func

    latest_movement = (
        db.query(
            models.LivestockMovement.livestock_id,
            func.max(models.LivestockMovement.movement_date).label("latest_date")
        )
        .group_by(models.LivestockMovement.livestock_id)
        .subquery()
    )

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


# ----------------------------------------------
# 🐄 Get dams (active cows/heifers)
# ----------------------------------------------
@router.get("/dams", response_model=List[schemas.LivestockResponse])
def get_dams(db: Session = Depends(get_db)):
    dams = (
        db.query(models.Livestock)
        .join(models.LivestockMovement, models.Livestock.id == models.LivestockMovement.livestock_id)
        .join(models.Category)
        .filter(
            models.Livestock.sex == "Female",
            models.Livestock.availability == "active",
            models.LivestockMovement.movement_type == "IN",
            models.Category.name.in_(["Cow", "Heifer"])
        )
        .all()
    )
    return dams


# ----------------------------------------------
# 🐄 Get active livestock in movements
# ----------------------------------------------
@router.get("/active/in-movements", response_model=List[schemas.LivestockResponse])
def get_active_livestock_in_movements(db: Session = Depends(get_db)):
    livestock = (
        db.query(models.Livestock)
        .join(models.LivestockMovement, models.Livestock.id == models.LivestockMovement.livestock_id)
        .filter(models.Livestock.availability == "active")
        .distinct()
        .all()
    )

    if not livestock:
        raise HTTPException(status_code=404, detail="No active livestock found in movements")

    return livestock


# ----------------------------------------------
# 🧩 Bulk upload livestock (CSV / Excel) with duplicate skip
# ----------------------------------------------
@router.post("/bulk-upload")
def bulk_upload_livestock(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = file.file.read()
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Invalid file type. Upload CSV or Excel.")

        required_columns = ["tag_number", "species_id", "category_id", "owner_id", "location_id", "sex", "dob", "castrated"]
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing)}")

        df.dropna(how="all", inplace=True)
        df.fillna({
            "tag_number": "",
            "species_id": 0,
            "category_id": 0,
            "owner_id": 0,
            "location_id": 0,
            "sex": "",
            "castrated": False
        }, inplace=True)

        numeric_cols = ["species_id", "category_id", "owner_id", "location_id"]
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

        created = 0
        skipped = []

        for _, row in df.iterrows():
            tag = str(row["tag_number"]).strip()
            if not tag:
                continue

            existing = db.query(models.Livestock).filter(models.Livestock.tag_number == tag).first()
            if existing:
                skipped.append(tag)
                continue

            dob_value = pd.to_datetime(row["dob"], errors="coerce").date() if not pd.isna(row["dob"]) else None

            livestock = models.Livestock(
                tag_number=tag,
                species_id=int(row["species_id"]),
                category_id=int(row["category_id"]),
                owner_id=int(row["owner_id"]),
                location_id=int(row["location_id"]),
                sex=str(row["sex"]).capitalize(),
                dob=dob_value,
                castrated=bool(row["castrated"]),
                availability="active",
            )
            db.add(livestock)
            db.commit()
            db.refresh(livestock)

            event = models.LivestockEvent(
                livestock_id=livestock.id,
                event_type="registered",
                event_date=datetime.utcnow().date(),
                notes="Bulk registration",
            )
            db.add(event)
            db.commit()

            move = models.LivestockMovement(
                livestock_id=livestock.id,
                movement_type="IN",
                source="bulk-upload",
                destination=str(livestock.location_id),
                movement_date=datetime.utcnow().date(),
                notes=f"Bulk registered {livestock.tag_number}",
            )
            db.add(move)
            db.commit()

            created += 1

        message = f"Successfully registered {created} livestock."
        if skipped:
            message += f" Skipped duplicates: {', '.join(skipped)}"

        return {"message": message}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
