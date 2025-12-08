# services/inventory_service.py
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, update
from sqlalchemy.exc import NoResultFound
import models
from datetime import date, datetime

DECIMAL_CTX = Decimal("0.0001")  # rounding context for calculations

# ---- Utility helpers ----
def _to_decimal(value) -> Decimal:
    if value is None:
        return Decimal("0")
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))

def _round(value: Decimal, places: int = 4) -> Decimal:
    q = Decimal(1).scaleb(-places)
    return value.quantize(q, rounding=ROUND_HALF_UP)

# ---- StockOnHand helpers ----
def get_or_create_stock_on_hand(session: Session, item_type: str, item_id: int, location_id: Optional[int] = None) -> models.StockOnHand:
    """
    Return a locked StockOnHand row (SELECT ... FOR UPDATE) or create it.
    item_type: 'livestock' or 'inventory_item'
    """
    stmt = select(models.StockOnHand).where(
        models.StockOnHand.item_type == item_type,
        models.StockOnHand.item_id == item_id,
        models.StockOnHand.location_id == location_id
    ).with_for_update()
    soh = session.execute(stmt).scalars().first()
    if soh:
        return soh

    soh = models.StockOnHand(
        item_type=item_type,
        item_id=item_id,
        location_id=location_id,
        quantity=Decimal("0"),
        avg_cost=Decimal("0"),
    )
    session.add(soh)
    session.flush()  # assign id
    return soh

# ---- Inflow (WAVG) ----
def apply_inflow(
    session: Session,
    item_type: str,
    item_id: int,
    location_id: Optional[int],
    qty,
    unit_cost,
    ref_table: Optional[str] = None,
    ref_id: Optional[int] = None,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Apply an inflow using Weighted Average logic.
    - qty: positive number
    - unit_cost: cost per unit for this inflow (currency)
    Returns a dict with updated soh values and created cost_history row id.
    """
    qty = _to_decimal(qty)
    unit_cost = _to_decimal(unit_cost)

    if qty <= 0:
        raise ValueError("qty must be > 0 for inflow")
    if unit_cost < 0:
        raise ValueError("unit_cost must be >= 0")

    with session.begin():
        soh = get_or_create_stock_on_hand(session, item_type, item_id, location_id)
        cur_qty = _to_decimal(soh.quantity)
        cur_avg = _to_decimal(soh.avg_cost)

        # Weighted average formula
        total_existing_cost = cur_qty * cur_avg
        new_total_qty = cur_qty + qty
        new_avg = Decimal("0")
        if new_total_qty > 0:
            new_avg = (total_existing_cost + qty * unit_cost) / new_total_qty

        # Round values for storage
        new_avg = _round(new_avg, 4)
        soh.quantity = new_total_qty
        soh.avg_cost = new_avg
        soh.last_updated = datetime.utcnow()
        session.add(soh)
        session.flush()

        # Insert CostHistory immutable inflow row
        total_cost = _round(qty * unit_cost, 4)
        ch = models.CostHistory(
            item_type=item_type,
            item_id=item_id,
            reference_type=ref_table,
            reference_id=ref_id,
            quantity=qty,
            unit_cost=_round(unit_cost, 4),
            total_cost=total_cost,
            remaining_qty=qty,
            created_at=datetime.utcnow(),
        )
        session.add(ch)
        session.flush()

        # Optionally, create an inventory_movement record for audit
        # Use your existing InventoryMovement model if you want to record inflows for inventory_items.
        # For livestock-type inflows we could still write into a dedicated inventory_movements table or reuse existing one.
        if item_type == "inventory_item":
            im = models.InventoryMovement(
                item_id=item_id,
                movement_type="in",
                quantity=qty,
                ref_table=ref_table,
                ref_id=ref_id,
                source_type="inflow",
                date=date.today(),
                notes=f"Inflow WAVG unit_cost={unit_cost}",
                created_at=datetime.utcnow()
            )
            session.add(im)

    return {
        "stock_on_hand_id": soh.id,
        "item_type": item_type,
        "item_id": item_id,
        "new_quantity": float(soh.quantity),
        "new_avg_cost": float(soh.avg_cost),
        "cost_history_id": ch.id
    }


# ---- Outflow (uses avg for valuation; consumes CostHistory FIFO for traceability) ----
def apply_outflow(
    session: Session,
    item_type: str,
    item_id: int,
    location_id: Optional[int],
    qty,
    ref_table: Optional[str] = None,
    ref_id: Optional[int] = None,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Apply an outflow. Returns a dict:
      { 'removed_total_cost': Decimal, 'used_avg_cost': Decimal, 'remaining_quantity': Decimal }
    The function:
      - locks SOH row
      - ensures sufficient quantity
      - reduces SOH.quantity (WAVG stays same)
      - consumes cost_history rows oldest-first and reduces remaining_qty
    """
    qty = _to_decimal(qty)
    if qty <= 0:
        raise ValueError("qty must be > 0 for outflow")

    with session.begin():
        soh = get_or_create_stock_on_hand(session, item_type, item_id, location_id)
        cur_qty = _to_decimal(soh.quantity)
        cur_avg = _to_decimal(soh.avg_cost)

        if cur_qty < qty:
            raise ValueError(f"Insufficient stock: have {cur_qty}, need {qty}")

        # reduce SOH quantity
        soh.quantity = cur_qty - qty
        soh.last_updated = datetime.utcnow()
        session.add(soh)
        session.flush()

        # consume cost_history FIFO
        removed_total = Decimal("0")
        remaining_to_consume = qty

        # select cost_history rows oldest-first that have remaining_qty > 0
        ch_rows = session.query(models.CostHistory).filter(
            models.CostHistory.item_type == item_type,
            models.CostHistory.item_id == item_id,
            models.CostHistory.remaining_qty > 0
        ).order_by(models.CostHistory.created_at.asc()).with_for_update().all()

        for ch in ch_rows:
            if remaining_to_consume <= 0:
                break
            available = _to_decimal(ch.remaining_qty)
            unit_cost = _to_decimal(ch.unit_cost)
            if available <= 0:
                continue
            if available <= remaining_to_consume:
                removed_total += available * unit_cost
                remaining_to_consume -= available
                ch.remaining_qty = Decimal("0")
            else:
                # partial consume
                removed_total += remaining_to_consume * unit_cost
                ch.remaining_qty = available - remaining_to_consume
                remaining_to_consume = Decimal("0")
            session.add(ch)

        if remaining_to_consume > 0:
            # this should not happen because we checked soh.quantity earlier,
            # but guard in case cost_history is inconsistent
            raise ValueError("Not enough cost_history remaining_qty to consume requested quantity")

        # Create inventory_movement audit record for inventory_item only
        if item_type == "inventory_item":
            im = models.InventoryMovement(
                item_id=item_id,
                movement_type="out",
                quantity=qty,
                ref_table=ref_table,
                ref_id=ref_id,
                source_type="outflow",
                date=date.today(),
                notes=f"Outflow qty={qty}",
                created_at=datetime.utcnow()
            )
            session.add(im)

    return {
        "item_type": item_type,
        "item_id": item_id,
        "removed_total_cost": float(_round(removed_total,4)),
        "used_avg_cost": float(_round(cur_avg,4)),
        "new_quantity": float(soh.quantity)
    }


# ---- Journal entry creator ----
def create_journal_entry(session: Session, journal_date: Optional[date], description: str, lines: List[Dict[str, Any]], ref_type: Optional[str]=None, ref_id: Optional[int]=None, user_id: Optional[int]=None) -> int:
    """
    lines: list of dicts: {'account_code': 'INV-MEAT', 'debit': Decimal(...), 'credit': Decimal(...), 'narration': '...'}
    Returns created journal_entry.id
    """
    with session.begin():
        je = models.JournalEntry(
            journal_date = journal_date or date.today(),
            description = description,
            reference_type = ref_type,
            reference_id = ref_id,
            created_by = user_id,
            created_at = datetime.utcnow()
        )
        session.add(je)
        session.flush()

        # Add lines
        total_debit = Decimal("0")
        total_credit = Decimal("0")
        for l in lines:
            debit = _to_decimal(l.get("debit", 0))
            credit = _to_decimal(l.get("credit", 0))
            jl = models.JournalLine(
                journal_entry_id = je.id,
                account_code = l["account_code"],
                debit = _round(debit,4),
                credit = _round(credit,4),
                narration = l.get("narration")
            )
            total_debit += debit
            total_credit += credit
            session.add(jl)

        # Basic balancing check (optional extra safety)
        if _round(total_debit,4) != _round(total_credit,4):
            raise ValueError(f"Journal not balanced: debit={total_debit} credit={total_credit}")

    return je.id


# ---- Process slaughter (high-level operation) ----
def process_slaughter(
    session: Session,
    livestock_id: int,
    meat_inventory_item_id: int,
    location_id: Optional[int],
    carcass_qty,
    processing_fee: Optional[float] = 0.0,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Convert one live animal into a meat inventory item.
    Steps:
      1) Read livestock stock_on_hand (must have qty >= 1)
      2) Outflow 1 unit of livestock (consume its book value)
      3) Inflow meat_inventory_item_id with qty=carcass_qty and unit_cost = livestock_book_value / carcass_qty
      4) Create journal entry moving book value from INV-LIVESTOCK -> INV-MEAT (and optionally processing fee)
      5) Mark livestock availability 'slaughtered' and create Exit record
    """
    carcass_qty = _to_decimal(carcass_qty)
    processing_fee = _to_decimal(processing_fee or 0)

    if carcass_qty <= 0:
        raise ValueError("carcass_qty must be > 0")

    with session.begin():
        # 1) get livestock SOH (lock)
        soh = get_or_create_stock_on_hand(session, "livestock", livestock_id, location_id)
        if _to_decimal(soh.quantity) < 1:
            raise ValueError(f"Livestock {livestock_id} not available (have {_to_decimal(soh.quantity)})")

        # compute livestock book value (we assume avg_cost stored as per-head book value)
        livestock_book_value = _to_decimal(soh.avg_cost)

        # 2) outflow livestock (1 head)
        out_result = apply_outflow(
            session=session,
            item_type="livestock",
            item_id=livestock_id,
            location_id=location_id,
            qty=1,
            ref_table="slaughter",
            ref_id=livestock_id,
            user_id=user_id
        )
        removed_total_cost = _to_decimal(out_result["removed_total_cost"])

        # Note: removed_total_cost should match livestock_book_value (or be very close).
        # If not identical, we still allocate removed_total_cost to meat.
        total_value_to_allocate = removed_total_cost + processing_fee

        # 3) compute meat unit cost
        meat_unit_cost = (total_value_to_allocate / carcass_qty) if carcass_qty > 0 else Decimal("0")
        meat_unit_cost = _round(meat_unit_cost, 4)

        # 4) inflow meat inventory
        inflow_result = apply_inflow(
            session=session,
            item_type="inventory_item",
            item_id=meat_inventory_item_id,
            location_id=location_id,
            qty=carcass_qty,
            unit_cost=meat_unit_cost,
            ref_table="slaughter",
            ref_id=livestock_id,
            user_id=user_id
        )

        # 5) create exit record for livestock (optional if your app uses Exit)
        exit_rec = models.Exit(
            livestock_id = livestock_id,
            exit_type = "slaughter",
            reason = f"Slaughtered into inventory {meat_inventory_item_id}",
            created_at = datetime.utcnow()
        )
        session.add(exit_rec)

        # 6) mark livestock availability / lifecycle event / event_date
        session.query(models.Livestock).filter(models.Livestock.id == livestock_id).update({
            "availability": "slaughtered",
            "lifecycle_event": "slaughter",
            "event_date": date.today()
        })

        # 7) create journal entry to move book value from livestock inventory -> meat inventory
        lines = []
        # Debit Meat inventory (increase asset)
        lines.append({
            "account_code": "INV-MEAT",  # replace with your actual account codes
            "debit": float(total_value_to_allocate),
            "credit": 0,
            "narration": f"Add meat stock from livestock {livestock_id}"
        })
        # Credit Livestock inventory (decrease asset)
        lines.append({
            "account_code": "INV-LIVESTOCK",
            "debit": 0,
            "credit": float(removed_total_cost),
            "narration": f"Remove livestock {livestock_id} from inventory"
        })
        # If processing_fee exists, record it as expense (debit processing expense, credit AP/Cash)
        if processing_fee > 0:
            lines.append({
                "account_code": "PROCESSING-EXP",
                "debit": float(processing_fee),
                "credit": 0,
                "narration": "Processing fee for slaughter"
            })
            lines.append({
                "account_code": "CASH-OR-AP",
                "debit": 0,
                "credit": float(processing_fee),
                "narration": "Processing fee payment"
            })

        je_id = create_journal_entry(
            session=session,
            journal_date = date.today(),
            description = f"Slaughter livestock {livestock_id} -> meat_item {meat_inventory_item_id}",
            lines = lines,
            ref_type = "slaughter",
            ref_id = livestock_id,
            user_id = user_id
        )

    return {
        "livestock_id": livestock_id,
        "meat_item_id": meat_inventory_item_id,
        "carcass_qty": float(carcass_qty),
        "meat_unit_cost": float(meat_unit_cost),
        "journal_entry_id": je_id,
        "exit_id": exit_rec.id
    }
