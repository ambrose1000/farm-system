from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database
from database import get_db


router = APIRouter(prefix="/buyers", tags=["Buyers"])

@router.get("/", response_model=list[schemas.BuyerResponse])
def get_buyers(db: Session = Depends(database.get_db)):
    return db.query(models.Buyer).all()

@router.post("/", response_model=schemas.BuyerResponse)
def create_buyer(buyer: schemas.BuyerCreate, db: Session = Depends(database.get_db)):
    new_buyer = models.Buyer(**buyer.dict())
    db.add(new_buyer)
    db.commit()
    db.refresh(new_buyer)
    return new_buyer

@router.put("/{buyer_id}", response_model=schemas.BuyerResponse)
def update_buyer(buyer_id: int, buyer: schemas.BuyerUpdate, db: Session = Depends(database.get_db)):
    db_buyer = db.query(models.Buyer).filter(models.Buyer.id == buyer_id).first()
    if not db_buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")

    update_data = buyer.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_buyer, key, value)

    db.commit()
    db.refresh(db_buyer)
    return db_buyer


@router.delete("/{buyer_id}")
def delete_buyer(buyer_id: int, db: Session = Depends(database.get_db)):
    db_buyer = db.query(models.Buyer).filter(models.Buyer.id == buyer_id).first()
    if not db_buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    db.delete(db_buyer)
    db.commit()
    return {"detail": "Buyer deleted"}



@router.get("/{buyer_id}/history", response_model=schemas.BuyerHistoryResponse)
def get_buyer_history(buyer_id: int, db: Session = Depends(get_db)):
    # Verify buyer exists
    buyer = db.query(models.Buyer).filter(models.Buyer.id == buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")

    # Fetch purchases made by this buyer
    sales = (
        db.query(models.Sale, models.SaleItem, models.Livestock)
        .join(models.SaleItem, models.Sale.id == models.SaleItem.sale_id)
        .join(models.Livestock, models.Livestock.id == models.SaleItem.livestock_id)
        .filter(models.Sale.buyer_id == buyer_id)
        .all()
    )

    purchase_list = []
    total_spent = 0
    for sale, sale_item, livestock in sales:
        purchase_list.append({
            "tag_number": livestock.tag_number,
            "species": getattr(livestock.species, "name", None) if livestock.species else None,
            "category": getattr(livestock.category, "name", None) if livestock.category else None,
            "purchase_date": sale.sale_date,
            "price": sale_item.price
        })
        total_spent += float(sale_item.price or 0)

    return {
        "buyer_id": buyer.id,
        "buyer_name": buyer.name,
        "phone": buyer.phone if hasattr(buyer, "phone") else None,
        "total_spent": total_spent,
        "purchases": purchase_list
    }

