from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database

router = APIRouter(prefix="/purchases", tags=["Purchases"])


# ------------------------
# from models.inventory import InventoryItem, InventoryMovement

@router.post("/", response_model=schemas.PurchaseResponse)
def create_purchase(purchase: schemas.PurchaseCreate, db: Session = Depends(database.get_db)):
    try:
        # Step 1: Create the main purchase record
        db_purchase = models.Purchase(
            vendor_id=purchase.vendor_id,
            purchase_date=purchase.purchase_date,
            total_cost=purchase.total_cost,
            notes=purchase.notes
        )
        db.add(db_purchase)
        db.flush()  # Generate purchase ID before commit

        items_responses = []
        events_responses = []

        # Step 2: Process each purchased livestock
        for item in purchase.items:
            # --- 2a. Create Livestock record ---
            db_livestock = models.Livestock(
                tag_number=item.tag_number,
                species_id=item.species_id,
                category_id=item.category_id,
                owner_id=item.owner_id,
                location_id=item.location_id,
                sex=item.sex,
                dob=item.dob,
                availability="active",
                purchase_id=db_purchase.id
            )
            db.add(db_livestock)
            db.flush()  # Get livestock ID

            # --- 2b. Create PurchaseItem record ---
            db_item = models.PurchaseItem(
                purchase_id=db_purchase.id,
                livestock_id=db_livestock.id,
                tag_number=item.tag_number,
                species_id=item.species_id,
                category_id=item.category_id,
                owner_id=item.owner_id,
                location_id=item.location_id,
                sex=item.sex,
                dob=item.dob,
                price=item.price,
                notes=item.notes
            )
            db.add(db_item)

            # --- 2c. Record Livestock Event ---
            purchase_event = models.LivestockEvent(
                livestock_id=db_livestock.id,
                event_type="purchase",
                event_date=db_purchase.purchase_date,
                purchase_id=db_purchase.id,
                notes=f"Purchased livestock (ref {db_purchase.id})"
            )
            db.add(purchase_event)
            db.flush()

            # --- 2d. Record Livestock Movement (IN) ---
            livestock_movement = models.LivestockMovement(
                livestock_id=db_livestock.id,
                movement_type="IN",
                source="vendor",
                destination="farm",
                movement_date=db_purchase.purchase_date,
                notes=f"Livestock purchased under purchase {db_purchase.id}"
            )
            db.add(livestock_movement)
            db.flush()

            # Collect ORM responses
            items_responses.append(schemas.PurchaseItemResponse.from_orm(db_item))
            events_responses.append(schemas.LivestockEventResponse.from_orm(purchase_event))

        # Step 3: Commit all at once (atomic)
        db.commit()
        db.refresh(db_purchase)

        # Step 4: Return structured response
        return schemas.PurchaseResponse(
            id=db_purchase.id,
            vendor_id=str(db_purchase.vendor_id),
            purchase_date=db_purchase.purchase_date,
            total_cost=db_purchase.total_cost,
            notes=db_purchase.notes,
            items=items_responses,
            events=events_responses
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating purchase: {str(e)}")


# ------------------------
# READ (all purchases)
# ------------------------
@router.get("/", response_model=List[schemas.PurchaseResponse])
def get_purchases(db: Session = Depends(database.get_db)):
    purchases = db.query(models.Purchase).all()
    responses = []

    for purchase in purchases:
        # --- Purchase Items ---
        items = db.query(models.PurchaseItem).filter(
            models.PurchaseItem.purchase_id == purchase.id
        ).all()
        items_responses = [
            {
                "id": item.id,
                "purchase_id": item.purchase_id,
                "livestock_id": item.livestock_id,
                "tag_number": item.tag_number,
                "species_id": item.species_id,
                "category_id": item.category_id,
                "owner_id": item.owner_id,
                "location_id": item.location_id,
                "sex": item.sex,
                "dob": item.dob,
                "price": item.price,
                "notes": item.notes,
                "created_at": item.created_at,
            }
            for item in items
        ]

        # --- Livestock Events ---
        livestock_ids = [item.livestock_id for item in items if item.livestock_id]
        events_responses = []
        if livestock_ids:
            events = db.query(models.LivestockEvent).filter(
                models.LivestockEvent.livestock_id.in_(livestock_ids)
            ).all()
            events_responses = [
                {
                    "id": ev.id,
                    "livestock_id": ev.livestock_id,
                    "event_type": ev.event_type,
                    "event_date": ev.event_date,
                    "purchase_id": ev.purchase_id,
                    "notes": ev.notes,
                    "created_at": ev.created_at,
                }
                for ev in events
            ]

        # --- Build Response ---
        responses.append(
            schemas.PurchaseResponse(
                id=purchase.id,
                reference=purchase.reference,
                vendor_id=str(purchase.vendor_id),  # 🔑 cast to str
                purchase_date=purchase.purchase_date,
                total_cost=purchase.total_cost,
                notes=purchase.notes,
                items=items_responses,
                events=events_responses,
            )
        )

    return responses


# ------------------------
# READ (single purchase)
# ------------------------
@router.get("/{purchase_id}", response_model=schemas.PurchaseResponse)
def get_purchase(purchase_id: int, db: Session = Depends(database.get_db)):
    purchase = (
        db.query(models.Purchase)
        .options(
            joinedload(models.Purchase.items).joinedload(models.PurchaseItem.livestock)
        )
        .filter(models.Purchase.id == purchase_id)
        .first()
    )

    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    # fetch livestock_ids from purchase items
    livestock_ids = [item.livestock_id for item in purchase.items]

    # fetch events
    events = db.query(models.LivestockEvent).filter(
        models.LivestockEvent.livestock_id.in_(livestock_ids)
    ).all()

    # attach for Pydantic
    purchase.events = events

    return purchase


# ------------------------
# UPDATE
# ------------------------
@router.put("/{purchase_id}", response_model=schemas.PurchaseResponse)
def update_purchase(purchase_id: int, updated_purchase: schemas.PurchaseCreate, db: Session = Depends(database.get_db)):
    purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    purchase.vendor_id = updated_purchase.vendor_id
    purchase.purchase_date = updated_purchase.purchase_date
    purchase.total_cost = updated_purchase.total_cost
    purchase.notes = updated_purchase.notes

    # Optional: handle updating items (here we just clear and re-add for simplicity)
    db.query(models.PurchaseItem).filter(models.PurchaseItem.purchase_id == purchase.id).delete()
    db.query(models.Livestock).filter(models.Livestock.purchase_id == purchase.id).delete()
    db.commit()

    for item in updated_purchase.items:
        db_livestock = models.Livestock(
            tag_number=item.tag_number,
            species_id=item.species_id,
            category_id=item.category_id,
            owner_id=item.owner_id,
            location_id=item.location_id,
            sex=item.sex,
            dob=item.dob,
            status="active",
            acquisition_type="purchased",
            purchase_id=purchase.id
        )
        db.add(db_livestock)
        db.commit()
        db.refresh(db_livestock)

        db_item = models.PurchaseItem(
            purchase_id=purchase.id,
            livestock_id=db_livestock.id,
            tag_number=item.tag_number,
            species_id=item.species_id,
            category_id=item.category_id,
            owner_id=item.owner_id,
            location_id=item.location_id,
            sex=item.sex,
            dob=item.dob,
            price=item.price,
            notes=item.notes
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        purchase.items.append(db_item)

    db.commit()
    db.refresh(purchase)
    return purchase


# ------------------------
# DELETE
# ------------------------
@router.delete("/{purchase_id}")
def delete_purchase(purchase_id: int, db: Session = Depends(database.get_db)):
    purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    db.delete(purchase)
    db.commit()
    return {"message": f"Purchase {purchase_id} deleted successfully"}
