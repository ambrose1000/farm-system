# routers/species.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, schemas

router = APIRouter(prefix="/species", tags=["Species"])

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Create species ---
@router.post("/", response_model=schemas.Species)
def create_species(species: schemas.SpeciesCreate, db: Session = Depends(get_db)):
    db_species = db.query(models.Species).filter(models.Species.name == species.name).first()
    if db_species:
        raise HTTPException(status_code=400, detail="Species already exists")
    new_species = models.Species(name=species.name)
    db.add(new_species)
    db.commit()
    db.refresh(new_species)
    return new_species

# --- Get all species ---
@router.get("/", response_model=list[schemas.Species])
def get_species(db: Session = Depends(get_db)):
    return db.query(models.Species).all()

# --- Get species by ID ---
@router.get("/{species_id}", response_model=schemas.Species)
def get_species_by_id(species_id: int, db: Session = Depends(get_db)):
    species = db.query(models.Species).get(species_id)
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    return species

# --- Delete species ---
@router.delete("/{species_id}")
def delete_species(species_id: int, db: Session = Depends(get_db)):
    species = db.query(models.Species).get(species_id)
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    db.delete(species)
    db.commit()
    return {"detail": "Species deleted successfully"}


# Update
@router.put("/{species_id}")
def update_species(species_id: int, species: schemas.SpeciesCreate, db: Session = Depends(database.get_db)):
    db_species = db.query(models.Species).filter(models.Species.id == species_id).first()
    if not db_species:
        raise HTTPException(status_code=404, detail="Species not found")
    db_species.name = species.name
    db.commit()
    db.refresh(db_species)
    return db_species