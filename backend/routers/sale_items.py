from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database

router = APIRouter(prefix="/sale_items", tags=["Sale Items"])


# ✅ Create Sale Item
@router.post("/", response_model=schemas.SaleItemResponse)
def create_sale_item(sale_item: schemas.SaleItemCreate, db: Session = Depends(database.get_db)):
    db_sale = models.SaleItem(**sale_item.dict())
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)
    return db_sale


# ✅ Get all Sale Items
@router.get("/", response_model=list[schemas.SaleItemResponse])
def get_sale_items(db: Session = Depends(database.get_db)):
    return db.query(models.SaleItem).all()


# ✅ Get Sale Item by ID
@router.get("/{sale_item_id}", response_model=schemas.SaleItemResponse)
def get_sale_item(sale_item_id: int, db: Session = Depends(database.get_db)):
    sale_item = db.query(models.SaleItem).filter(models.SaleItem.id == sale_item_id).first()
    if not sale_item:
        raise HTTPException(status_code=404, detail="Sale Item not found")
    return sale_item


# ✅ Update Sale Item
@router.put("/{sale_item_id}", response_model=schemas.SaleItemResponse)
def update_sale_item(sale_item_id: int, sale_item: schemas.SaleItemUpdate, db: Session = Depends(database.get_db)):
    db_sale_item = db.query(models.SaleItem).filter(models.SaleItem.id == sale_item_id).first()
    if not db_sale_item:
        raise HTTPException(status_code=404, detail="Sale Item not found")
    for key, value in sale_item.dict(exclude_unset=True).items():
        setattr(db_sale_item, key, value)
    db.commit()
    db.refresh(db_sale_item)
    return db_sale_item


# ✅ Delete Sale Item
@router.delete("/{sale_item_id}")
def delete_sale_item(sale_item_id: int, db: Session = Depends(database.get_db)):
    db_sale_item = db.query(models.SaleItem).filter(models.SaleItem.id == sale_item_id).first()
    if not db_sale_item:
        raise HTTPException(status_code=404, detail="Sale Item not found")
    db.delete(db_sale_item)
    db.commit()
    return {"detail": "Sale Item deleted"}
