from fastapi import APIRouter, HTTPException,Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Farm

router = APIRouter()

@router.get("/farm")
def get_farm_info(db: Session = Depends(get_db)):
    farm = db.query(Farm).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return {
        "id": farm.id,
        "name": farm.name,
        "owner_name": farm.owner_name,
        "location": farm.location,
        "contact": farm.contact,
    }

@router.post("/farm")
def create_farm(farm_data: dict, db: Session = Depends(get_db)):
    new_farm = Farm(**farm_data)
    db.add(new_farm)
    db.commit()
    db.refresh(new_farm)
    return new_farm
