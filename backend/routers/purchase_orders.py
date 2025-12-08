from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from database import get_db
import models, schemas

router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])


# 🧾 1️⃣ Create a Purchase Order (LPO)
@router.post("/", response_model=schemas.PurchaseOrderResponse)
def create_purchase_order(order_data: schemas.PurchaseOrderCreate, db: Session = Depends(get_db)):
    """Create a new Local Purchase Order (LPO) with its items."""

    # ✅ Validate vendor
    vendor = db.query(models.Vendor).filter(models.Vendor.id == order_data.vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # ✅ Create main order
    new_order = models.PurchaseOrder(
        vendor_id=order_data.vendor_id,
        order_date=order_data.order_date or date.today(),
        expected_delivery_date=order_data.expected_delivery_date,
        status=order_data.status or "draft",
        notes=order_data.notes
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # ✅ Add items & calculate total
    total = 0
    for item in order_data.items:
        subtotal = item.quantity * item.unit_price
        total += subtotal
        order_item = models.PurchaseOrderItem(
            order_id=new_order.id,
            item_id=item.item_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=subtotal
        )
        db.add(order_item)

    new_order.total_amount = total
    db.commit()
    db.refresh(new_order)

    return new_order


# 📋 2️⃣ Get all LPOs
@router.get("/", response_model=List[schemas.PurchaseOrderResponse])
def get_all_orders(db: Session = Depends(get_db)):
    """Fetch all purchase orders."""
    orders = db.query(models.PurchaseOrder).order_by(models.PurchaseOrder.id.desc()).all()
    return orders


# 🔍 3️⃣ Get one LPO by ID
@router.get("/{order_id}", response_model=schemas.PurchaseOrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Fetch a single purchase order with its items."""
    order = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ✏️ 4️⃣ Update LPO (details + items)
@router.put("/{order_id}", response_model=schemas.PurchaseOrderResponse)
def update_order(order_id: int, update_data: schemas.PurchaseOrderCreate, db: Session = Depends(get_db)):
    """Update an existing purchase order (including replacing items)."""
    order = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # ✅ Update main fields
    for key, value in update_data.dict(exclude={"items"}, exclude_unset=True).items():
        setattr(order, key, value)

    # ✅ Replace all items if new ones provided
    if update_data.items:
        db.query(models.PurchaseOrderItem).filter(models.PurchaseOrderItem.order_id == order.id).delete()
        total = 0
        for item in update_data.items:
            subtotal = item.quantity * item.unit_price
            total += subtotal
            db.add(models.PurchaseOrderItem(
                order_id=order.id,
                item_id=item.item_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=subtotal
            ))
        order.total_amount = total

    db.commit()
    db.refresh(order)
    return order


# 🚫 5️⃣ Delete LPO
@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """Delete a purchase order and its items."""
    order = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    db.delete(order)
    db.commit()
    return {"detail": f"Order {order_id} deleted successfully"}
