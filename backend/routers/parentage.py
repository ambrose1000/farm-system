# routers/parentage.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db

router = APIRouter(prefix="/parentage", tags=["Parentage"])

@router.post("/", response_model=schemas.ParentageResponse)
def create_parentage(data: schemas.ParentageCreate, db: Session = Depends(get_db)):
    calf = db.query(models.Livestock).filter(models.Livestock.id == data.calf_id).first()
    if not calf:
        raise HTTPException(status_code=404, detail="Calf not found")

    parentage = models.Parentage(**data.dict())
    db.add(parentage)
    db.commit()
    db.refresh(parentage)
    return parentage

@router.get("/", response_model=list[schemas.ParentageResponse])
def list_parentage(db: Session = Depends(get_db)):
    return db.query(models.Parentage).all()
