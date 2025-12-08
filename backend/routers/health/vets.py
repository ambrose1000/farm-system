from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database

router = APIRouter(prefix="/vets", tags=["Vets"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[schemas.VetResponse])
def get_vets(db: Session = Depends(get_db)):
    return db.query(models.Vet).all()

@router.post("/", response_model=schemas.VetResponse)
def create_vet(vet: schemas.VetCreate, db: Session = Depends(get_db)):
    db_vet = models.Vet(**vet.dict())
    db.add(db_vet)
    db.commit()
    db.refresh(db_vet)
    return db_vet

@router.put("/{vet_id}", response_model=schemas.VetResponse)
def update_vet(vet_id: int, vet: schemas.VetUpdate, db: Session = Depends(get_db)):
    db_vet = db.query(models.Vet).filter(models.Vet.id == vet_id).first()
    if not db_vet:
        raise HTTPException(status_code=404, detail="Vet not found")
    for key, value in vet.dict(exclude_unset=True).items():
        setattr(db_vet, key, value)
    db.commit()
    db.refresh(db_vet)
    return db_vet

@router.delete("/{vet_id}")
def delete_vet(vet_id: int, db: Session = Depends(get_db)):
    db_vet = db.query(models.Vet).filter(models.Vet.id == vet_id).first()
    if not db_vet:
        raise HTTPException(status_code=404, detail="Vet not found")
    db.delete(db_vet)
    db.commit()
    return {"detail": "Vet deleted"}
