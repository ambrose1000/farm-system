from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, schemas

router = APIRouter(prefix="/categories", tags=["Categories"])

# Create
@router.post("/")
def create_category(category: schemas.CategoryCreate, db: Session = Depends(database.get_db)):
    db_cat = models.Category(name=category.name, species_id=category.species_id)
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

# Read all
@router.get("/")
def get_categories(db: Session = Depends(database.get_db)):
    return db.query(models.Category).all()

# Update
@router.put("/{category_id}")
def update_category(category_id: int, category: schemas.CategoryCreate, db: Session = Depends(database.get_db)):
    db_cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db_cat.name = category.name
    db_cat.species_id = category.species_id
    db.commit()
    db.refresh(db_cat)
    return db_cat

# Delete
@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(database.get_db)):
    db_cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(db_cat)
    db.commit()
    return {"detail": "Deleted"}
