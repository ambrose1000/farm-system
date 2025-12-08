# routers/stores.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter(prefix="/stores", tags=["stores"])

@router.get("/", response_model=List[schemas.StoreResponse])
def list_stores(db: Session = Depends(get_db)):
    return db.query(models.Store).order_by(models.Store.id).all()

@router.post("/", response_model=schemas.StoreResponse)
def create_store(s: schemas.StoreCreate, db: Session = Depends(get_db)):
    store = models.Store(name=s.name, location=s.location, description=s.description)
    db.add(store)
    db.commit()
    db.refresh(store)
    return store

@router.get("/{store_id}", response_model=schemas.StoreResponse)
def get_store(store_id: int, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

@router.delete("/{store_id}")
def delete_store(store_id: int, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    db.delete(store)
    db.commit()
    return {"detail": "Store deleted"}
