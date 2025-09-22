from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/diseases", tags=["Diseases"])


@router.get("/", response_model=list[schemas.Disease])
def get_diseases(db: Session = Depends(get_db)):
    return db.query(models.Disease).all()


@router.post("/", response_model=schemas.Disease)
def create_disease(disease: schemas.DiseaseCreate, db: Session = Depends(get_db)):
    new_disease = models.Disease(**disease.dict())
    db.add(new_disease)
    db.commit()
    db.refresh(new_disease)
    return new_disease


@router.put("/{disease_id}", response_model=schemas.Disease)
def update_disease(disease_id: int, disease: schemas.DiseaseUpdate, db: Session = Depends(get_db)):
    db_disease = db.query(models.Disease).filter(models.Disease.id == disease_id).first()
    if not db_disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    for key, value in disease.dict(exclude_unset=True).items():
        setattr(db_disease, key, value)
    db.commit()
    db.refresh(db_disease)
    return db_disease


@router.delete("/{disease_id}")
def delete_disease(disease_id: int, db: Session = Depends(get_db)):
    db_disease = db.query(models.Disease).filter(models.Disease.id == disease_id).first()
    if not db_disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    db.delete(db_disease)
    db.commit()
    return {"detail": "Disease deleted"}
