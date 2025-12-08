# routers/management_purchase.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database

router = APIRouter(
    prefix="/purchases",
    tags=["Purchases"]
)

# Dependency to get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=schemas.PurchaseResponse)
def create_purchase(purchase: schemas.PurchaseCreate, db: Session = Depends(get_db)):
    """
    Create a new purchase record with animals included.
    """
    # 1. Save purchase record
    db_purchase = models.Purchase(
        vendor=purchase.vendor,
        reference=purchase.reference,
        date=purchase.date,
        notes=purchase.notes,
        total_cost=0.0  # will calculate from items
    )
    db.add(db_purchase)
    db.commit()
    db.refresh(db_purchase)

    total_cost = 0.0

    # 2. Save each purchased animal (PurchaseItem + Livestock entry)
    for animal in purchase.animals:
        db_item = models.PurchaseItem(
            purchase_id=db_purchase.id,
            species=animal.species,
            sex=animal.sex,
            dob=animal.dob,
            tag=animal.tag,
            status=animal.status,
            price=animal.price
        )
        db.add(db_item)

        # Also create animal in Livestock table
        db_livestock = models.Livestock(
            species=animal.species,
            sex=animal.sex,
            dob=animal.dob,
            tag=animal.tag,
            status=animal.status,
            active=True  # active when purchased
        )
        db.add(db_livestock)

        total_cost += animal.price

    # 3. Update total cost
    db_purchase.total_cost = total_cost
    db.commit()
    db.refresh(db_purchase)

    return db_purchase


@router.get("/", response_model=List[schemas.PurchaseResponse])
def get_purchases(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """
    Get list of purchases with items
    """
    purchases = db.query(models.Purchase).offset(skip).limit(limit).all()
    return purchases


@router.get("/{purchase_id}", response_model=schemas.PurchaseResponse)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    """
    Get a single purchase with items
    """
    purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase
