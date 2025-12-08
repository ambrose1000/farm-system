from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database

router = APIRouter(prefix="/medications", tags=["Medications"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[schemas.MedicationResponse])
def get_medications(db: Session = Depends(get_db)):
    return db.query(models.Medication).all()

@router.post("/", response_model=schemas.MedicationResponse)
def create_medication(med: schemas.MedicationCreate, db: Session = Depends(get_db)):
    db_med = models.Medication(**med.dict())
    db.add(db_med)
    db.commit()
    db.refresh(db_med)
    return db_med

@router.put("/{med_id}", response_model=schemas.MedicationResponse)
def update_medication(med_id: int, med: schemas.MedicationUpdate, db: Session = Depends(get_db)):
    db_med = db.query(models.Medication).filter(models.Medication.id == med_id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medication not found")
    for key, value in med.dict(exclude_unset=True).items():
        setattr(db_med, key, value)
    db.commit()
    db.refresh(db_med)
    return db_med

@router.delete("/{med_id}")
def delete_medication(med_id: int, db: Session = Depends(get_db)):
    db_med = db.query(models.Medication).filter(models.Medication.id == med_id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medication not found")
    db.delete(db_med)
    db.commit()
    return {"detail": "Medication deleted"}
