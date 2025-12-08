from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
import models, schemas, database   
from database import get_db
from datetime import datetime
from typing import List




router = APIRouter(prefix="/sales", tags=["Sales"])

# --- Generate Reference for Sales (like PO-0001 but SO-0001) ---
def generate_reference(db: Session):
    last_sale = db.query(models.Sale).order_by(models.Sale.id.desc()).first()
    if not last_sale:
        return "SO-0001"
    last_number = int(last_sale.id)
    return f"SO-{last_number + 1:04d}"


# --- Create Sale ---
@router.post("/", response_model=schemas.SaleResponse)
def create_sale(sale: schemas.SaleCreate, db: Session = Depends(get_db)):
    try:
        # Step 1: Create main sale record
        db_sale = models.Sale(
            buyer_id=sale.buyer_id,
            sale_date=sale.sale_date,
            total_amount=sale.total_amount,
            notes=sale.notes,
        )
        db.add(db_sale)
        db.flush()  # generate sale.id

        sale_items_responses = []
        sale_events_responses = []

        # Step 2: Process each sold livestock
        for item in sale.items:
            livestock = db.query(models.Livestock).filter(
                models.Livestock.id == item.livestock_id
            ).first()

            if not livestock:
                raise HTTPException(status_code=404, detail=f"Livestock ID {item.livestock_id} not found")
            if livestock.availability == "inactive":
                raise HTTPException(status_code=400, detail=f"Livestock ID {item.livestock_id} is already inactive")

            # --- 2a. Record Sale Item ---
            sale_item = models.SaleItem(
                sale_id=db_sale.id,
                livestock_id=item.livestock_id,
                price=item.price,
            )
            db.add(sale_item)
            db.flush()

            # --- 2b. Update Livestock availability ---
            livestock.availability = "inactive"
            db.flush()

            # --- 2c. Create Livestock Event ---
            sale_event = models.LivestockEvent(
                livestock_id=livestock.id,
                event_type="sale",
                event_date=db_sale.sale_date,
                sale_id=db_sale.id,
                notes=f"Livestock sold under sale {db_sale.id}",
            )
            db.add(sale_event)
            db.flush()

            # --- 2d. Create Livestock Movement (OUT) ---
            livestock_move = models.LivestockMovement(
                livestock_id=livestock.id,
                movement_type="OUT",
                source="farm",
                destination="buyer",
                movement_date=db_sale.sale_date,
                notes=f"Livestock sold under sale {db_sale.id}",
            )
            db.add(livestock_move)
            db.flush()

            # Collect response objects
            sale_items_responses.append(schemas.SaleItemResponse.from_orm(sale_item))
            sale_events_responses.append(schemas.LivestockEventResponse.from_orm(sale_event))

        # Step 3: Commit once
        db.commit()
        db.refresh(db_sale)

        # Step 4: Fetch buyer info
        buyer = db.query(models.Buyer).filter(models.Buyer.id == db_sale.buyer_id).first()
        buyer_resp = schemas.BuyerResponse.from_orm(buyer) if buyer else None

        # Step 5: Return structured response
        return schemas.SaleResponse(
            id=db_sale.id,
            buyer_id=db_sale.buyer_id,
            created_at=db_sale.created_at,
            buyer=buyer_resp,
            sale_date=db_sale.sale_date,
            total_amount=db_sale.total_amount,
            notes=db_sale.notes,
            items=sale_items_responses,
            events=sale_events_responses,
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating sale: {str(e)}")

@router.get("/{sale_id}", response_model=schemas.SaleResponse)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = (
        db.query(models.Sale)
        .options(
            joinedload(models.Sale.items).joinedload(models.SaleItem.livestock),  # sale items + animals
            joinedload(models.Sale.buyer),  # buyer info
        )
        .filter(models.Sale.id == sale_id)
        .first()
    )

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    # 👇 fetch livestock_ids in this sale
    livestock_ids = [item.livestock_id for item in sale.items]

    # 👇 fetch events related to livestock in this sale
    events = (
        db.query(models.LivestockEvent)
        .filter(models.LivestockEvent.livestock_id.in_(livestock_ids))
        .all()
    )

    # attach events to response
    sale.events = events

    return sale

@router.get("/", response_model=list[schemas.SaleResponse])
def list_sales(db: Session = Depends(get_db)):
    sales = db.query(models.Sale).options(
        joinedload(models.Sale.items).joinedload(models.SaleItem.livestock),
        joinedload(models.Sale.buyer),
    ).all()

    # Collect all livestock IDs across all sales
    all_livestock_ids = []
    for sale in sales:
        all_livestock_ids.extend([item.livestock_id for item in sale.items])

    if all_livestock_ids:
        # Fetch all events for these livestock
        events = (
            db.query(models.LivestockEvent)
            .filter(models.LivestockEvent.livestock_id.in_(all_livestock_ids))
            .all()
        )

        # Group events by livestock_id for easy lookup
        events_by_livestock = {}
        for event in events:
            events_by_livestock.setdefault(event.livestock_id, []).append(event)

        # Attach events to each sale
        for sale in sales:
            sale.events = []
            for item in sale.items:
                if item.livestock_id in events_by_livestock:
                    sale.events.extend(events_by_livestock[item.livestock_id])

    return sales
