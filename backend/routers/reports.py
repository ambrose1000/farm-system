from fastapi import APIRouter, Depends,HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, database
from datetime import datetime
from typing import List, Optional



router = APIRouter(prefix="/reports", tags=["Reports"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ================================
# Existing endpoints
# ================================
@router.get("/inventory")
def inventory_report(db: Session = Depends(get_db)):
    total = db.query(func.count(models.Livestock.id)).scalar()

    species_data = (
        db.query(
            models.Species.id.label("species_id"),
            models.Species.name.label("species_name"),
            func.count(models.Livestock.id).label("count"),
        )
        .join(models.Livestock, models.Livestock.species_id == models.Species.id)
        .group_by(models.Species.id, models.Species.name)
        .all()
    )

    owner_data = (
        db.query(
            models.Owner.id.label("owner_id"),
            models.Owner.name.label("owner_name"),
            func.count(models.Livestock.id).label("count"),
        )
        .join(models.Livestock, models.Livestock.owner_id == models.Owner.id)
        .group_by(models.Owner.id, models.Owner.name)
        .all()
    )

    return {
        "total": total or 0,
        "by_species": [dict(row._mapping) for row in species_data],
        "by_owner": [dict(row._mapping) for row in owner_data],
    }


@router.get("/health-events-summary")
def health_events_summary(
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
):
    q = (
        db.query(
            models.HealthEventType.id.label("event_type_id"),
            models.HealthEventType.name.label("event_type_name"),
            func.count(models.HealthEvent.id).label("count"),
        )
        .join(
            models.HealthEvent,
            models.HealthEvent.event_type_id == models.HealthEventType.id
        )
    )

    if date_from:
        q = q.filter(models.HealthEvent.date >= date_from)
    if date_to:
        q = q.filter(models.HealthEvent.date <= date_to)

    q = q.group_by(models.HealthEventType.id, models.HealthEventType.name).all()
    return [dict(row._mapping) for row in q]


@router.get("/disease-incidence")
def disease_incidence(
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
):
    q = (
        db.query(
            models.Disease.id.label("disease_id"),
            models.Disease.name.label("disease_name"),
            func.count(models.HealthEvent.id).label("count"),
        )
        .join(models.HealthEvent, models.HealthEvent.disease_id == models.Disease.id)
        .filter(models.HealthEvent.disease_id.isnot(None))
    )

    if date_from:
        q = q.filter(models.HealthEvent.date >= date_from)
    if date_to:
        q = q.filter(models.HealthEvent.date <= date_to)

    q = q.group_by(models.Disease.id, models.Disease.name).all()
    return [dict(row._mapping) for row in q]


# ================================
# New: Health report endpoints
# ================================
@router.get("/health-report")
def health_report(
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns:
      - total_sick: number of animals with disease events
      - sick_animals: list of livestock with disease info
    """
    q = (
        db.query(
            models.Livestock.id.label("livestock_id"),
            models.Livestock.tag_number.label("tag_number"),
            models.Species.name.label("species"),
            models.Owner.name.label("owner"),
            models.Disease.name.label("disease"),
            models.HealthEvent.date.label("event_date"),
            models.HealthEvent.notes.label("notes"),
        )
        .join(models.HealthEvent, models.HealthEvent.livestock_id == models.Livestock.id)
        .join(models.Disease, models.HealthEvent.disease_id == models.Disease.id)
        .join(models.Species, models.Livestock.species_id == models.Species.id)
        .join(models.Owner, models.Livestock.owner_id == models.Owner.id)
    )

    if date_from:
        q = q.filter(models.HealthEvent.date >= date_from)
    if date_to:
        q = q.filter(models.HealthEvent.date <= date_to)

    sick_animals = [dict(row._mapping) for row in q.all()]
    return {
        "total_sick": len(sick_animals),
        "sick_animals": sick_animals,
    }


@router.get("/health-report")
def health_report(
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns:
      - total_sick: number of animals with health events
      - sick_animals: list of livestock with disease info (if available)
    """
    q = (
        db.query(
            models.Livestock.id.label("livestock_id"),
            models.Livestock.tag_number.label("tag_number"),
            models.Species.name.label("species"),
            models.Owner.name.label("owner"),
            models.Disease.name.label("disease"),
            models.HealthEvent.date.label("event_date"),
            models.HealthEvent.notes.label("notes"),
        )
        .join(models.HealthEvent, models.HealthEvent.livestock_id == models.Livestock.id)
        .outerjoin(models.Disease, models.HealthEvent.disease_id == models.Disease.id)  # 👈 outer join, disease optional
        .join(models.Species, models.Livestock.species_id == models.Species.id)
        .join(models.Owner, models.Livestock.owner_id == models.Owner.id)
    )

    if date_from:
        q = q.filter(models.HealthEvent.date >= date_from)
    if date_to:
        q = q.filter(models.HealthEvent.date <= date_to)

    animals = [dict(row._mapping) for row in q.all()]

    return {
        "total_sick": len(animals),
        "sick_animals": animals,
    }
@router.get("/health-report")
def health_report(
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns:
      - total_sick: number of animals with health events
      - sick_animals: list of livestock with disease info (if available)
    """
    q = (
        db.query(
            models.Livestock.id.label("livestock_id"),
            models.Livestock.tag_number.label("tag_number"),
            models.Species.name.label("species"),
            models.Owner.name.label("owner"),
            models.Disease.name.label("disease"),
            models.HealthEvent.date.label("event_date"),
            models.HealthEvent.notes.label("notes"),
        )
        .join(models.HealthEvent, models.HealthEvent.livestock_id == models.Livestock.id)
        .outerjoin(models.Disease, models.HealthEvent.disease_id == models.Disease.id)  # 👈 outer join, disease optional
        .join(models.Species, models.Livestock.species_id == models.Species.id)
        .join(models.Owner, models.Livestock.owner_id == models.Owner.id)
    )

    if date_from:
        q = q.filter(models.HealthEvent.date >= date_from)
    if date_to:
        q = q.filter(models.HealthEvent.date <= date_to)

    animals = [dict(row._mapping) for row in q.all()]

    return {
        "total_sick": len(animals),
        "sick_animals": animals,
    }

@router.get("/stock-balance")
def stock_balance_report(
    store_id: int = None,
    item_id: int = None,
    db: Session = Depends(get_db)
):
    try:
        query = (
            db.query(
                models.InventoryItem.id.label("item_id"),
                models.InventoryItem.name.label("item_name"),
                models.Store.id.label("store_id"),
                models.Store.name.label("store_name"),
                models.StoreInventory.quantity.label("quantity_on_hand"),
                models.StoreInventory.avg_cost.label("avg_cost"),
            )
            .join(models.StoreInventory, models.InventoryItem.id == models.StoreInventory.item_id)
            .join(models.Store, models.Store.id == models.StoreInventory.store_id)
        )

        if store_id:
            query = query.filter(models.StoreInventory.store_id == store_id)
        if item_id:
            query = query.filter(models.StoreInventory.item_id == item_id)

        rows = query.all()

        return [
            {
                "item_id": r.item_id,
                "item_name": r.item_name,
                "store_id": r.store_id,
                "store_name": r.store_name,
                "quantity_on_hand": r.quantity_on_hand or 0,
                "avg_cost": float(r.avg_cost or 0),
                "total_value": float((r.quantity_on_hand or 0) * (r.avg_cost or 0)),
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock balance: {str(e)}")

@router.get("/stock-movements")
def stock_movements_report(
    location_id: int = None,  # store/boma
    item_id: int = None,
    date_from: str = None,
    date_to: str = None,
    db: Session = Depends(get_db)
):
    try:
        query = (
            db.query(
                models.InventoryMovement.id,
                models.InventoryMovement.item_id,
                models.InventoryItem.name.label("item_name"),
                models.InventoryMovement.location_id,
                models.InventoryMovement.quantity,
                models.InventoryMovement.movement_type,
                models.InventoryMovement.reference_type,
                models.InventoryMovement.reference_id,
                models.InventoryMovement.created_at,
            )
            .join(models.InventoryItem, models.InventoryItem.id == models.InventoryMovement.item_id)
        )

        if location_id:
            query = query.filter(models.InventoryMovement.location_id == location_id)
        if item_id:
            query = query.filter(models.InventoryMovement.item_id == item_id)
        if date_from and date_to:
            query = query.filter(models.InventoryMovement.created_at.between(date_from, date_to))

        movements = query.order_by(models.InventoryMovement.created_at.desc()).all()

        return [
            {
                "movement_id": m.id,
                "item_id": m.item_id,
                "item_name": m.item_name,
                "location_id": m.location_id,
                "quantity": m.quantity,
                "movement_type": m.movement_type,
                "reference_type": m.reference_type,
                "reference_id": m.reference_id,
                "created_at": m.created_at,
            }
            for m in movements
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock movements: {str(e)}")



@router.get("/reports/issues-transfers")
def issues_transfers_report(
    source_store_id: int = None,
    dest_store_id: int = None,
    item_id: int = None,
    date_from: datetime = None,
    date_to: datetime = None,
    db: Session = Depends(get_db)
):
    # create alias for destination store
    dest_store_alias = aliased(models.Store)

    query = (
        db.query(
            models.IssueReceipt,
            models.IssueReceiptItem,
            models.InventoryItem.name.label("item_name"),
            models.Store.name.label("source_store_name"),
            dest_store_alias.name.label("dest_store_name")
        )
        .join(models.IssueReceiptItem, models.IssueReceiptItem.issue_receipt_id == models.IssueReceipt.id)
        .join(models.InventoryItem, models.InventoryItem.id == models.IssueReceiptItem.item_id)
        .join(models.Store, models.Store.id == models.IssueReceipt.source_store_id)
        .join(dest_store_alias, models.IssueReceipt.dest_store_id == dest_store_alias.id)
    )

    if source_store_id:
        query = query.filter(models.IssueReceipt.source_store_id == source_store_id)
    if dest_store_id:
        query = query.filter(models.IssueReceipt.dest_store_id == dest_store_id)
    if item_id:
        query = query.filter(models.IssueReceiptItem.item_id == item_id)
    if date_from and date_to:
        query = query.filter(models.IssueReceipt.created_at.between(date_from, date_to))

    rows = query.all()

    return [
        {
            "issue_id": r.IssueReceipt.id,
            "source_store_id": r.IssueReceipt.source_store_id,
            "source_store": r.source_store_name,
            "dest_store_id": r.IssueReceipt.dest_store_id,
            "dest_store": r.dest_store_name,
            "item_id": r.IssueReceiptItem.item_id,
            "item_name": r.item_name,
            "quantity": r.IssueReceiptItem.quantity,
            "issued_by": r.IssueReceipt.issued_by,
            "received_by": r.IssueReceipt.received_by,
            "created_at": r.IssueReceipt.created_at,
        }
        for r in rows
    ]

