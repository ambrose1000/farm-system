from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(
    prefix="/vendors",
    tags=["Vendors"]
)

@router.get("/", response_model=list[schemas.VendorResponse])
def get_vendors(db: Session = Depends(get_db)):
    return db.query(models.Vendor).all()

@router.post("/", response_model=schemas.VendorResponse)
def create_vendor(vendor: schemas.VendorCreate, db: Session = Depends(get_db)):
    new_vendor = models.Vendor(**vendor.dict())
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

@router.put("/{vendor_id}", response_model=schemas.VendorResponse)
def update_vendor(vendor_id: int, vendor: schemas.VendorUpdate, db: Session = Depends(get_db)):
    db_vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for key, value in vendor.dict(exclude_unset=True).items():
        setattr(db_vendor, key, value)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@router.delete("/{vendor_id}")
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    db_vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    db.delete(db_vendor)
    db.commit()
    return {"detail": "Vendor deleted successfully"}


@router.get("/{vendor_id}/history", response_model=schemas.VendorHistoryResponse)
def get_vendor_history(vendor_id: int, db: Session = Depends(get_db)):
    # ✅ Verify vendor exists
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # ✅ Fetch purchases from this vendor
    purchases = (
        db.query(models.Purchase, models.PurchaseItem, models.Livestock)
        .join(models.PurchaseItem, models.Purchase.id == models.PurchaseItem.purchase_id)
        .join(models.Livestock, models.Livestock.id == models.PurchaseItem.livestock_id)
        .filter(models.Purchase.vendor_id == vendor_id)
        .all()
    )

    purchase_list = []
    total_spent = 0

    for purchase, purchase_item, livestock in purchases:
        purchase_list.append({
            "tag_number": livestock.tag_number,
            "species": getattr(livestock.species, "name", None) if livestock.species else None,
            "category": getattr(livestock.category, "name", None) if livestock.category else None,
            "purchase_date": purchase.purchase_date,
            "price": purchase_item.price
        })
        total_spent += float(purchase_item.price or 0)

    # ✅ API return format
    return {
        "vendor_id": vendor.id,
        "vendor_name": vendor.name,
        "phone": vendor.phone if hasattr(vendor, "phone") else None,
        "total_spent": total_spent,
        "purchases": purchase_list
    }

@router.get("/search")
def search_vendor(name: str, db: Session = Depends(get_db)):
    vendor = db.query(models.Vendor).filter(models.Vendor.name.ilike(f"%{name}%")).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    return {
        "id": vendor.id,
        "name": vendor.name,
        "phone": vendor.phone if hasattr(vendor, "phone") else None
    }
