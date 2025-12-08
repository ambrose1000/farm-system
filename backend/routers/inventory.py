# routers/inventory.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
import models, schemas, database
from sqlalchemy import func


router = APIRouter(prefix="/inventory", tags=["Inventory"])


# 🧩 1️⃣ Create Inventory Item
@router.post("/items", response_model=schemas.InventoryItemResponse)
def create_inventory_item(
    item: schemas.InventoryItemCreate, db: Session = Depends(database.get_db)
):
    try:
        # 🔍 Prevent duplicate by name
        existing = (
            db.query(models.InventoryItem)
            .filter(func.lower(models.InventoryItem.name) == item.name.lower())
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Inventory item already exists")

        db_item = models.InventoryItem(
            name=item.name,
            type_id=item.type_id,
            unit_id=item.unit_id,
            cost_price=item.cost_price,
            notes=item.notes,
            created_at=datetime.utcnow(),
        )

        db.add(db_item)
        db.commit()
        db.refresh(db_item)

        return db_item

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating inventory item: {str(e)}")


# 📦 2️⃣ Get All Inventory Items
@router.get("/items", response_model=List[schemas.InventoryItemResponse])
def get_inventory_items(db: Session = Depends(database.get_db)):
    try:
        return db.query(models.InventoryItem).order_by(models.InventoryItem.id.desc()).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching items: {str(e)}")


# ⚙️ 3️⃣ Create Transaction (Stock IN / OUT)
@router.post("/transactions", response_model=schemas.InventoryTransactionResponse)
def create_transaction(
    txn: schemas.InventoryTransactionCreate, db: Session = Depends(database.get_db)
):
    try:
        item = (
            db.query(models.InventoryItem)
            .filter(models.InventoryItem.id == txn.item_id)
            .first()
        )
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")

        db_txn = models.InventoryTransaction(
            item_id=txn.item_id,
            transaction_type=txn.transaction_type,
            quantity=txn.quantity,
            location_id=txn.location_id,
            reference_type=txn.reference_type,
            reference_id=txn.reference_id,
            date=txn.date or datetime.utcnow(),
            notes=txn.notes,
        )

        db.add(db_txn)
        db.commit()
        db.refresh(db_txn)

        return db_txn

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating transaction: {str(e)}")


# 📊 4️⃣ Get All Transactions
@router.get("/transactions", response_model=List[schemas.InventoryTransactionResponse])
def get_transactions(db: Session = Depends(database.get_db)):
    try:
        return (
            db.query(models.InventoryTransaction)
            .order_by(models.InventoryTransaction.date.desc())
            .all()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transactions: {str(e)}")


#@router.get("/stock", response_model=List[schemas.InventoryStockResponse])
def get_stock_summary(db: Session = Depends(database.get_db)):
    try:
        items = db.query(models.InventoryItem).all()
        stock_summary = []

        for item in items:
            total = (
                db.query(func.sum(models.InventoryMovement.quantity))
                .filter(models.InventoryMovement.item_id == item.id)
                .scalar()
                or 0
            )

            stock_summary.append({
                "item_id": item.id,
                "item_name": item.name,
                "available_stock": total,
                "unit_id": item.unit_id,
            })

        return stock_summary

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock summary: {str(e)}")

# 📦 2️⃣ Get All Inventory Items (with readable type and unit)
@router.get("/items", response_model=List[schemas.InventoryItemResponse])
def get_inventory_items(db: Session = Depends(database.get_db)):
    try:
        # Perform JOINs to include type and unit names
        results = (
            db.query(
                models.InventoryItem,
                models.InventoryType.name.label("type_name"),
                models.Unit.name.label("unit_name"),
            )
            .join(models.InventoryType, models.InventoryItem.type_id == models.InventoryType.id)
            .join(models.Unit, models.InventoryItem.unit_id == models.Unit.id)
            .order_by(models.InventoryItem.id.desc())
            .all()
        )

        # Transform results into dictionaries that match the schema
        items = []
        for item, type_name, unit_name in results:
            items.append({
                "id": item.id,
                "name": item.name,
                "type_id": item.type_id,
                "unit_id": item.unit_id,
                "cost_price": item.cost_price,
                "notes": item.notes,
                "created_at": item.created_at,
                "type_name": type_name,
                "unit_name": unit_name,
            })

        return items

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching items: {str(e)}")
# 📝 3️⃣ Update Inventory Item
@router.put("/items/{item_id}", response_model=schemas.InventoryItemResponse)
def update_inventory_item(item_id: int, item: schemas.InventoryItemCreate, db: Session = Depends(database.get_db)):
    db_item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    db_item.name = item.name
    db_item.type_id = item.type_id
    db_item.unit_id = item.unit_id
    db_item.cost_price = item.cost_price
    db_item.notes = item.notes

    db.commit()
    db.refresh(db_item)
    return db_item
