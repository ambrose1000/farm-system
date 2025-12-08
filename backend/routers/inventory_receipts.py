# routers/inventory_receipts.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Optional,List
from decimal import Decimal
from sqlalchemy import func
from schemas import IssueStockRequest, IssueStockResponse
import models
from models import InventoryMovement, StoreInventory, InventoryItem, IssueReceipt
from datetime import datetime



from database import get_db
import models, schemas



router = APIRouter(prefix="/inventory", tags=["inventory"])
@router.post("/receipts", response_model=schemas.GoodsReceiptResponse)
def create_goods_receipt(rcv_in: schemas.GoodsReceiptCreate, db: Session = Depends(get_db)):
    """
    Create GRN: write GoodsReceiptItem(s), add InventoryMovement IN entries for MAIN_STORE_ID (or provided store),
    update StoreInventory and InventoryItem.quantity_on_hand.
    """
    MAIN_STORE_ID = 1
    try:
        # --- Step 1: Determine store ---
        store_id = getattr(rcv_in, "store_id", None) or MAIN_STORE_ID
        store_obj = db.query(models.Store).filter(models.Store.id == store_id).first()
        if not store_obj:
            raise HTTPException(status_code=404, detail="Store not found")

        # --- Step 2: Create GoodsReceipt header ---
        receipt = models.GoodsReceipt(
            purchase_order_id=rcv_in.purchase_order_id,
            store_id=store_id,
            received_by=rcv_in.received_by,
            notes=rcv_in.notes
        )
        db.add(receipt)
        db.flush()  # populate receipt.id

        # --- Step 3: Process each item ---
        for row in rcv_in.items:
            qty = int(row.quantity_received)
            if qty <= 0:
                raise HTTPException(status_code=400, detail="quantity_received must be > 0")

            inv_item = db.query(models.InventoryItem).filter(models.InventoryItem.id == row.item_id).first()
            if not inv_item:
                raise HTTPException(status_code=404, detail=f"Inventory item {row.item_id} not found")

            # --- GoodsReceiptItem ---
            gr_item = models.GoodsReceiptItem(
                receipt_id=receipt.id,
                item_id=row.item_id,
                store_id=store_id,  # ✅ set store_id
                quantity_received=qty,
                cost_price=row.cost_price
            )
            db.add(gr_item)

            # --- InventoryMovement ---
            mv = models.InventoryMovement(
                item_id=row.item_id,
                location_id=store_id,
                quantity=qty,
                movement_type="RECEIPT",
                reference_type="goods_receipt",
                reference_id=receipt.id,
                created_at=datetime.utcnow()
            )
            db.add(mv)

            # --- Update or create StoreInventory ---
            si = db.query(models.StoreInventory).filter(
                models.StoreInventory.store_id == store_id,
                models.StoreInventory.item_id == row.item_id
            ).with_for_update(nowait=False).first()

            if not si:
                si = models.StoreInventory(
                    store_id=store_id,
                    item_id=row.item_id,
                    quantity=qty,
                    avg_cost=row.cost_price
                )
                db.add(si)
            else:
                prev_qty = float(si.quantity or 0)
                prev_cost = float(si.avg_cost or 0)
                si.quantity = prev_qty + qty
                # weighted average
                if row.cost_price is not None:
                    si.avg_cost = (prev_cost * prev_qty + float(row.cost_price) * qty) / si.quantity
                db.add(si)

            # --- Update global inventory quantity ---
            inv_item.quantity_on_hand = (inv_item.quantity_on_hand or 0) + qty
            db.add(inv_item)

        # --- Step 4: Commit all changes ---
        db.commit()
        db.refresh(receipt)
        return receipt

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating goods receipt: {str(e)}")

@router.get("/stock", response_model=List[schemas.StockResponse])
def get_stock(db: Session = Depends(get_db)):
    stock_summary = (
        db.query(
            models.InventoryMovement.item_id,
            func.sum(models.InventoryMovement.quantity).label("quantity_on_hand")
        )
        .group_by(models.InventoryMovement.item_id)
        .all()
    )

    stock_data = []
    for row in stock_summary:
        item = db.query(models.InventoryItem).filter(models.InventoryItem.id == row.item_id).first()
        stock_data.append({
            "item_id": row.item_id,
            "item_name": item.name,
            "quantity_on_hand": row.quantity_on_hand or 0
        })

    return stock_data
def ensure_main_store(db: Session):
    """
    Safe helper: return the 'Main Store' record, creating it if missing.
    Use this when caller omits store_id.
    """
    main = db.query(models.Store).filter(models.Store.name == "Main Store").first()
    if not main:
        main = models.Store(name="Main Store", location="Main", description="Auto-created main store")
        db.add(main)
        db.commit()
        db.refresh(main)
    return main

@router.post("/direct-receipt", response_model=schemas.GoodsReceiptResponse)
def create_direct_receipt(
    rcv_in: schemas.GoodsReceiptCreate, 
    db: Session = Depends(get_db)
):
    """
    Directly receive stock without a Purchase Order.
    Works exactly like /receipts but skips PO validation.
    """

    try:
        # --- Ensure store exists or fallback to Main Store ---
        store_id = getattr(rcv_in, "store_id", None)

        if not store_id:
            # Try to find main store
            main_store = (
                db.query(models.Store)
                .filter(models.Store.name == "Main Store")
                .first()
            )
            if not main_store:
                # Auto-create main store if missing
                main_store = models.Store(
                    name="Main Store",
                    location="Default",
                    description="Auto-created main store",
                )
                db.add(main_store)
                db.commit()
                db.refresh(main_store)

            store_id = main_store.id
        else:
            store_obj = (
                db.query(models.Store)
                .filter(models.Store.id == store_id)
                .first()
            )
            if not store_obj:
                raise HTTPException(status_code=404, detail="Store not found")

        # --- Create receipt header ---
        receipt = models.GoodsReceipt(
            purchase_order_id=None,   # direct receipt has no PO
            store_id=store_id,
            received_by=rcv_in.received_by or "System",
            notes=rcv_in.notes,
        )
        db.add(receipt)
        db.flush()  # populate receipt.id

        # --- Process each item ---
        for row in rcv_in.items:
            qty = int(row.quantity_received)
            if qty <= 0:
                raise HTTPException(
                    status_code=400, 
                    detail="quantity_received must be > 0"
                )

            inv_item = (
                db.query(models.InventoryItem)
                .filter(models.InventoryItem.id == row.item_id)
                .first()
            )
            if not inv_item:
                raise HTTPException(
                    status_code=404,
                    detail=f"Inventory item {row.item_id} not found",
                )

            # --- Create GoodsReceiptItem ---
            gr_item = models.GoodsReceiptItem(
                receipt_id=receipt.id,
                item_id=row.item_id,
                store_id=store_id,        # MUST be included
                quantity_received=qty,
                cost_price=row.cost_price,
            )
            db.add(gr_item)

            # --- Inventory Movement (Ledger) ---
            movement = models.InventoryMovement(
                item_id=row.item_id,
                location_id=store_id,
                quantity=qty,
                movement_type="RECEIPT",
                reference_type="direct_receipt",
                reference_id=receipt.id,
                created_at=datetime.utcnow(),
            )
            db.add(movement)

            # --- Update or create StoreInventory ---
            si = (
                db.query(models.StoreInventory)
                .filter(
                    models.StoreInventory.store_id == store_id,
                    models.StoreInventory.item_id == row.item_id
                )
                .with_for_update(nowait=False)
                .first()
            )

            if not si:
                si = models.StoreInventory(
                    store_id=store_id,
                    item_id=row.item_id,
                    quantity=qty,
                    avg_cost=row.cost_price,
                )
                db.add(si)
            else:
                prev_qty = float(si.quantity or 0)
                prev_cost = float(si.avg_cost or 0)

                si.quantity = prev_qty + qty

                # Weighted average cost
                if row.cost_price is not None:
                    si.avg_cost = (
                        (prev_cost * prev_qty) 
                        + (float(row.cost_price) * qty)
                    ) / si.quantity

                db.add(si)

            # --- Update global inventory quantity ---
            inv_item.quantity_on_hand = (inv_item.quantity_on_hand or 0) + qty
            db.add(inv_item)

        # --- Commit all changes ---
        db.commit()
        db.refresh(receipt)
        return receipt

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating direct receipt: {str(e)}"
        )


# GET last cost price for an item
@router.get("/items/{item_id}/last-cost")
def get_last_cost(item_id: int, db: Session = Depends(get_db)):
    """
    Returns the last cost_price recorded for the given item_id (from GoodsReceiptItem).
    Response: { "cost_price": <number|null> }
    """
    try:
        GRItem = getattr(models, "GoodsReceiptItem", None)
        if GRItem is None:
            # If there is no GoodsReceiptItem model, we can't determine past cost here.
            return {"cost_price": None}

        last = (
            db.query(GRItem.cost_price)
            .filter(GRItem.item_id == item_id)
            .order_by(getattr(GRItem, "id").desc())
            .first()
        )

        if not last or last[0] is None:
            return {"cost_price": None}

        # Ensure JSON-serializable numeric (float)
        try:
            cp = float(last[0])
        except Exception:
            cp = None

        return {"cost_price": cp}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching last cost: {str(e)}")
@router.get("/stock/{store_id}", response_model=List[schemas.StockResponse])
def get_store_stock(store_id: int, db: Session = Depends(get_db)):
    stock_summary = (
        db.query(
            models.InventoryMovement.item_id,
            func.sum(models.InventoryMovement.quantity).label("quantity_on_hand")
        )
        .filter(models.InventoryMovement.location_id == store_id)
        .group_by(models.InventoryMovement.item_id)
        .all()
    )

    stock_data = []
    for row in stock_summary:
        item = db.query(models.InventoryItem).filter(models.InventoryItem.id == row.item_id).first()
        stock_data.append({
            "item_id": row.item_id,
            "item_name": item.name,
            "quantity_on_hand": row.quantity_on_hand or 0
        })

    return stock_data


@router.post("/transfer", response_model=schemas.IssueReceiptResponse)
def transfer_stock(payload: schemas.IssueCreate, db: Session = Depends(get_db)):
    """
    Transfer items from one store to another (multi-item).
    - Validates source != destination
    - Validates source has enough qty per item
    - Creates two InventoryMovement entries per item (OUT and IN)
    - Updates StoreInventory rows (create dst row if missing)
    - Updates InventoryItem.quantity_on_hand as sum of store_inventories
    - Transfers cost: uses payload.cost_price if given, else tries:
        1) source store avg_cost
        2) last GRN cost (GoodsReceiptItem)
        3) 0.0 fallback
    """
    if payload.source_store_id == payload.destination_store_id:
        raise HTTPException(status_code=400, detail="Source and destination stores must be different")

    src = db.query(models.Store).filter(models.Store.id == payload.source_store_id).first()
    dst = db.query(models.Store).filter(models.Store.id == payload.destination_store_id).first()
    if not src or not dst:
        raise HTTPException(status_code=404, detail="Source or destination store not found")

    StoreInv = getattr(models, "StoreInventory", None)
    Movement = getattr(models, "InventoryMovement", None)
    if StoreInv is None or Movement is None:
        raise HTTPException(status_code=500, detail="Required models missing (StoreInventory/InventoryMovement)")

    # helper: last GRN cost
    def get_last_grn_cost(item_id: int):
        GRItem = getattr(models, "GoodsReceiptItem", None)
        if GRItem is None:
            return None
        last = (
            db.query(GRItem.cost_price)
            .filter(GRItem.item_id == item_id)
            .order_by(getattr(GRItem, "id").desc())
            .first()
        )
        return float(last[0]) if last and last[0] is not None else None

    response_items = []
    try:
        with db.begin():
            # optional IssueReceipt record (best-effort)
            IssueModel = getattr(models, "IssueReceipt", None)
            issue_obj = None
            if IssueModel is not None:
                issue_obj = IssueModel(
                    source_store_id=payload.source_store_id,
                    destination_store_id=payload.destination_store_id,
                    issued_by=payload.issued_by,
                    received_by=payload.received_by,
                    notes=payload.notes,
                    created_at=datetime.utcnow() if hasattr(IssueModel, "created_at") else None
                )
                db.add(issue_obj)
                db.flush()
                issue_id = getattr(issue_obj, "id", None)
            else:
                issue_id = None

            for line in payload.items:
                item_id = int(line.item_id)
                qty = float(line.quantity)
                if qty <= 0:
                    raise HTTPException(status_code=400, detail="Quantity must be > 0")

                # lock and read source inventory
                src_inv = (
                    db.query(StoreInv)
                    .filter(StoreInv.store_id == payload.source_store_id, StoreInv.item_id == item_id)
                    .with_for_update(nowait=False)
                    .first()
                )
                if not src_inv or float(src_inv.quantity or 0) < qty:
                    raise HTTPException(status_code=400, detail=f"Insufficient stock in source store for item {item_id}")

                # determine cost to transfer
                # priority: payload.cost_price -> src_inv.avg_cost -> last GRN cost -> 0.0
                cost = None
                if getattr(line, "cost_price", None) is not None:
                    cost = float(line.cost_price)
                elif getattr(src_inv, "avg_cost", None) is not None:
                    cost = float(src_inv.avg_cost)
                else:
                    last = get_last_grn_cost(item_id)
                    cost = float(last) if last is not None else 0.0

                # create OUT movement (negative quantity)
                out_m = Movement(
                    item_id=item_id,
                    location_id=payload.source_store_id,
                    quantity=-abs(qty),
                    movement_type="ISSUE_OUT",
                    reference_type="stock_transfer",
                    reference_id=issue_id
                )
                db.add(out_m)

                # deduct source store inventory
                src_inv.quantity = float(src_inv.quantity) - qty
                db.add(src_inv)

                # create IN movement (positive quantity)
                in_m = Movement(
                    item_id=item_id,
                    location_id=payload.destination_store_id,
                    quantity=abs(qty),
                    movement_type="ISSUE_IN",
                    reference_type="stock_transfer",
                    reference_id=issue_id
                )
                db.add(in_m)

                # update destination store inventory (create if missing)
                dst_inv = (
                    db.query(StoreInv)
                    .filter(StoreInv.store_id == payload.destination_store_id, StoreInv.item_id == item_id)
                    .with_for_update(nowait=False)
                    .first()
                )
                if not dst_inv:
                    dst_inv = StoreInv(store_id=payload.destination_store_id, item_id=item_id, quantity=0, avg_cost=cost)
                    db.add(dst_inv)
                    db.flush()

                # weighted average cost at destination
                prev_qty = float(dst_inv.quantity or 0)
                prev_cost = float(dst_inv.avg_cost or 0) if dst_inv.avg_cost is not None else 0.0
                new_total_qty = prev_qty + qty
                if new_total_qty > 0:
                    new_avg_cost = ((prev_qty * prev_cost) + (qty * cost)) / new_total_qty
                else:
                    new_avg_cost = cost
                dst_inv.avg_cost = new_avg_cost
                dst_inv.quantity = prev_qty + qty
                db.add(dst_inv)

                # recalc global inventory item quantity_on_hand (sum across stores)
                item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
                total = (
                    db.query(func.coalesce(func.sum(StoreInv.quantity), 0))
                    .filter(StoreInv.item_id == item_id)
                    .scalar()
                )
                item.quantity_on_hand = float(total or 0)
                db.add(item)

                response_items.append({"item_id": item_id, "quantity": qty, "cost_price": cost})

        # commit happens at exit
        resp = {
            "id": issue_id,
            "source_store_id": payload.source_store_id,
            "destination_store_id": payload.destination_store_id,
            "issued_by": payload.issued_by,
            "received_by": payload.received_by,
            "notes": payload.notes,
            "items": response_items,
        }
        return resp

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error transferring stock: {str(e)}")




MAIN_STORE_ID = 1  # enforced main store

@router.get("/stock", response_model=List[schemas.StockResponse])
def get_main_store_stock(db: Session = Depends(get_db)):
    """
    Return stock list for MAIN_STORE only: item_id, item_name, main_qty.
    This uses InventoryMovement sums for MAIN_STORE so it reflects receipts/transfers/movements.
    """
    Movement = getattr(models, "InventoryMovement", None)
    Item = getattr(models, "InventoryItem", None)
    if Movement is None or Item is None:
        raise HTTPException(status_code=500, detail="Required models missing (InventoryMovement/InventoryItem)")

    rows = (
        db.query(
            Movement.item_id,
            func.coalesce(func.sum(Movement.quantity), 0).label("main_qty")
        )
        .filter(Movement.location_id == MAIN_STORE_ID)
        .group_by(Movement.item_id)
        .all()
    )

    stock_data = []
    for r in rows:
        item = db.query(Item).filter(Item.id == r.item_id).first()
        stock_data.append({
            "item_id": int(r.item_id),
            "item_name": item.name if item else "",
            "quantity_on_hand": float(r.main_qty or 0)
        })

    return stock_data

@router.get("/stock", response_model=List[schemas.StockResponse])
def get_main_stock(db: Session = Depends(get_db)):
    Movement = models.InventoryMovement
    Item = models.InventoryItem
    rows = (
        db.query(Movement.item_id, func.coalesce(func.sum(Movement.quantity), 0).label("qty"))
        .filter(Movement.location_id == MAIN_STORE_ID)
        .group_by(Movement.item_id)
        .all()
    )
    out = []
    for r in rows:
        item = db.query(Item).filter(Item.id == r.item_id).first()
        out.append({"item_id": int(r.item_id), "item_name": item.name if item else "", "quantity_on_hand": float(r.qty)})
    return out

@router.get("/stock/{store_id}", response_model=List[schemas.StockResponse])
def get_store_stock(store_id: int, db: Session = Depends(get_db)):
    Movement = models.InventoryMovement
    Item = models.InventoryItem
    rows = (
        db.query(Movement.item_id, func.coalesce(func.sum(Movement.quantity), 0).label("qty"))
        .filter(Movement.location_id == store_id)
        .group_by(Movement.item_id)
        .all()
    )
    out = []
    for r in rows:
        item = db.query(Item).filter(Item.id == r.item_id).first()
        out.append({"item_id": int(r.item_id), "item_name": item.name if item else "", "quantity_on_hand": float(r.qty)})
    return out


@router.get("/stock/{store_id}", response_model=List[schemas.StockResponse])
def get_store_stock(store_id: int, db: Session = Depends(get_db)):
    Movement = models.InventoryMovement
    Item = models.InventoryItem
    rows = (
        db.query(Movement.item_id, func.coalesce(func.sum(Movement.quantity), 0).label("qty"))
        .filter(Movement.location_id == store_id)
        .group_by(Movement.item_id)
        .all()
    )
    out = []
    for r in rows:
        item = db.query(Item).filter(Item.id == r.item_id).first()
        out.append({"item_id": int(r.item_id), "item_name": item.name if item else "", "quantity_on_hand": float(r.qty)})
    return out


@router.post("/issue", response_model=IssueStockResponse)
def issue_stock(payload: IssueStockRequest, db: Session = Depends(get_db)):
    """
    Issue stock from main store to another store.
    Updates InventoryMovement and StoreInventory.
    """
    source_id = payload.source_store_id
    dest_id = payload.destination_store_id

    if source_id == dest_id:
        raise HTTPException(status_code=400, detail="Source and destination cannot be the same")

    # Loop through each item and update InventoryMovement
    for item in payload.items:
        # 1️⃣ Record outgoing movement from main store
        movement_out = InventoryMovement(
            item_id=item.item_id,
            location_id=source_id,
            quantity=-item.quantity,
            movement_type="issue",
            reference_type="transfer",
            reference_id=None,
            created_at=datetime.utcnow().date()
        )
        db.add(movement_out)

        # 2️⃣ Record incoming movement to destination store
        movement_in = InventoryMovement(
            item_id=item.item_id,
            location_id=dest_id,
            quantity=item.quantity,
            movement_type="receive",
            reference_type="transfer",
            reference_id=None,
            created_at=datetime.utcnow().date()
        )
        db.add(movement_in)

        # 3️⃣ Update or create StoreInventory at destination
        store_inv = (
            db.query(StoreInventory)
            .filter(StoreInventory.store_id == dest_id, StoreInventory.item_id == item.item_id)
            .first()
        )
        if store_inv:
            store_inv.quantity += item.quantity
        else:
            store_inv = StoreInventory(
                store_id=dest_id,
                item_id=item.item_id,
                quantity=item.quantity,
                avg_cost=item.cost_price,
            )
            db.add(store_inv)

    db.commit()
    return {"success": True, "message": "Stock issued successfully"}