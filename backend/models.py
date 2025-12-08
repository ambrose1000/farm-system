from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime, Float, Text, Boolean, Numeric,UniqueConstraint, TIMESTAMP,CheckConstraint,Enum
from sqlalchemy.orm import relationship
from datetime import datetime  # <-- This is needed for datetime.utcnow
from database import Base
import enum
from sqlalchemy import Enum
from sqlalchemy.sql import func
# ----------------------------
# User model
# ----------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)


# ----------------------------
# Enums
# ----------------------------
class SpeciesEnum(str, enum.Enum):
    cow = "cow"
    sheep = "sheep"
    goat = "goat"


class SexEnum(str, enum.Enum):
    male = "male"
    female = "female"


# ----------------------------
# Species, Category, Location, Owner
# ----------------------------
class Species(Base):
    __tablename__ = "species"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)

    categories = relationship("Category", back_populates="species")
    livestock = relationship("Livestock", back_populates="species")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    species_id = Column(Integer, ForeignKey("species.id"))
    name = Column(String, nullable=False)

    species = relationship("Species", back_populates="categories")
    livestock = relationship("Livestock", back_populates="category")


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    livestock = relationship("Livestock", back_populates="location")


class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)

    livestock = relationship("Livestock", back_populates="owner")


# ----------------------------
# Livestock
# ----------------------------
class Livestock(Base):
    __tablename__ = "livestock"

    id = Column(Integer, primary_key=True, index=True)
    tag_number = Column(String, unique=True, nullable=False)
    species_id = Column(Integer, ForeignKey("species.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    owner_id = Column(Integer, ForeignKey("owners.id"))
    location_id = Column(Integer, ForeignKey("locations.id"))
    sex = Column(String, nullable=True)
    dob = Column(Date, nullable=True)
    castrated = Column(Boolean, default=False)

    # ✅ lifecycle tracking
    lifecycle_event = Column(String, nullable=True)   # e.g., "sold", "death", "slaughter"
    event_date = Column(Date, nullable=True)
    origin = Column(String(50))
    availability = Column(String(20), nullable=False, default="active") 

    purchase_id = Column(Integer, ForeignKey("purchases.id"))
    purchase_price = Column(Numeric(12, 2), nullable=True)
   
    # Relationships
    movements = relationship("LivestockMovement", back_populates="livestock")

    sale_items = relationship("SaleItem", back_populates="livestock", cascade="all, delete-orphan")
    births_sire = relationship("Birth", foreign_keys="Birth.sire_id", back_populates="sire")
    births_dam = relationship("Birth", foreign_keys="Birth.dam_id", back_populates="dam")
    health_events = relationship("HealthEvent", back_populates="livestock")
    events = relationship("LivestockEvent", back_populates="livestock", cascade="all, delete-orphan")
    purchase = relationship("Purchase", back_populates="livestock")
    exits = relationship("Exit", back_populates="livestock")
   

    # Backrefs
    species = relationship("Species", back_populates="livestock")
    category = relationship("Category", back_populates="livestock")
    owner = relationship("Owner", back_populates="livestock")
    location = relationship("Location", back_populates="livestock")



class LivestockEvent(Base):
    __tablename__ = "livestock_events"

    id = Column(Integer, primary_key=True, index=True)
    livestock_id = Column(Integer, ForeignKey("livestock.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)  # e.g. 'registered', 'purchase', 'sale', 'death'
    event_date = Column(Date, nullable=False, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    health_event_id = Column(Integer, ForeignKey("health_events.id"), nullable=True)  # <-- new field
    created_at = Column(DateTime, default=datetime.utcnow)
    exit_id = Column(Integer, ForeignKey("exits.id"), nullable=True)

    # Relationships
    livestock = relationship("Livestock", back_populates="events")
    purchase = relationship("Purchase", back_populates="events")
    sale = relationship("Sale", back_populates="events")
    health_event = relationship("HealthEvent", backref="livestock_event") 
    exit = relationship("Exit", back_populates="events")


# ----------------------------
# Livestock Health
# ----------------------------
class Disease(Base):
    __tablename__ = "diseases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    dosage = Column(String, nullable=True)


class Vet(Base):
    __tablename__ = "vets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)


class HealthEventType(Base):
    __tablename__ = "health_event_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)


class HealthEvent(Base):
    __tablename__ = "health_events"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)

    livestock_id = Column(Integer, ForeignKey("livestock.id"), nullable=False)
    event_type_id = Column(Integer, ForeignKey("health_event_types.id"), nullable=False)
    disease_id = Column(Integer, ForeignKey("diseases.id"), nullable=True)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=True)
    vet_id = Column(Integer, ForeignKey("vets.id"), nullable=True)

    notes = Column(Text, nullable=True)

    # Relationships
    livestock = relationship("Livestock")
    event_type = relationship("HealthEventType")
    disease = relationship("Disease")
    medication = relationship("Medication")
    vet = relationship("Vet")


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact_person = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)

    # If you have a Purchase model, you can link it like this:
    purchases = relationship("Purchase", back_populates="vendor")
    purchase_orders = relationship("PurchaseOrder", back_populates="vendor")


class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(255), nullable=False, server_default=func.concat(
        "PUR-", func.lpad(func.nextval("purchase_reference_seq").cast(String), 6, "0")
    ))
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    purchase_date = Column(Date, nullable=False)
    total_cost = Column(Numeric(12, 2))
    notes = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")
    livestock = relationship("Livestock", back_populates="purchase")
    vendor = relationship("Vendor", back_populates="purchases")
    events = relationship("LivestockEvent", back_populates="purchase")

class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id", ondelete="CASCADE"), nullable=False)
    livestock_id = Column(Integer, ForeignKey("livestock.id", ondelete="SET NULL"))
    tag_number = Column(String(255))
    species_id = Column(Integer)
    category_id = Column(Integer)
    owner_id = Column(Integer)
    location_id = Column(Integer)
    sex = Column(String(50))
    dob = Column(Date)
    price = Column(Numeric(12, 2))
    notes = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    purchase = relationship("Purchase", back_populates="items")
   


#Birth and parentage 

class Birth(Base):
    __tablename__ = "births"

    id = Column(Integer, primary_key=True, index=True)
    tag_number = Column(String, unique=True, nullable=False)
    dob = Column(Date, nullable=False)
    sex = Column(String, nullable=False)

    sire_id = Column(Integer, ForeignKey("livestock.id"), nullable=True)
    dam_id = Column(Integer, ForeignKey("livestock.id"), nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sire = relationship("Livestock", foreign_keys=[sire_id])
    dam = relationship("Livestock", foreign_keys=[dam_id])


class Parentage(Base):
    __tablename__ = "parentage"

    id = Column(Integer, primary_key=True, index=True)
    calf_id = Column(Integer, ForeignKey("livestock.id", ondelete="CASCADE"))
    sire_id = Column(Integer, ForeignKey("livestock.id"))
    dam_id = Column(Integer, ForeignKey("livestock.id"))
    notes = Column(Text, nullable=True)

    calf = relationship("Livestock", foreign_keys=[calf_id])
    sire = relationship("Livestock", foreign_keys=[sire_id])
    dam = relationship("Livestock", foreign_keys=[dam_id])




class Buyer(Base):
    __tablename__ = "buyers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    sales = relationship("Sale", back_populates="buyer")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("buyers.id"), nullable=False)
    sale_date = Column(Date, nullable=False)
    total_amount = Column(Numeric(12,2), nullable=False, default=0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("Buyer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    events = relationship("LivestockEvent", back_populates="sale")
class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    livestock_id = Column(Integer, ForeignKey("livestock.id"), nullable=False)
    price = Column(Numeric(12,2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sale = relationship("Sale", back_populates="items")
    livestock = relationship("Livestock", back_populates="sale_items")

class Exit(Base):
    __tablename__ = "exits"

    id = Column(Integer, primary_key=True, index=True)
    livestock_id = Column(Integer, ForeignKey("livestock.id"), nullable=False)
    exit_type = Column(String(20), nullable=False)  # "death" or "slaughter"
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    livestock = relationship("Livestock", back_populates="exits")
    events = relationship("LivestockEvent", back_populates="exit")


class Farm(Base):
    __tablename__ = "farm"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    owner_name = Column(String(255))
    location = Column(String(255))
    contact = Column(String(100))
    created_at = Column(TIMESTAMP, server_default=func.now())



class LivestockMovement(Base):
    __tablename__ = "livestock_movements"

    id = Column(Integer, primary_key=True, index=True)
    livestock_id = Column(Integer, ForeignKey("livestock.id"), nullable=False)
    movement_type = Column(String, nullable=False)  # "IN" or "OUT"
    source = Column(String)
    destination = Column(String)
    movement_date = Column(Date, nullable=False)
    notes = Column(String)

    livestock = relationship("Livestock", back_populates="movements")


#
# Inventory types (medicine, feed, fuel, etc.)
class InventoryType(Base):
    __tablename__ = "inventory_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("InventoryItem", back_populates="type", cascade="all, delete-orphan")

class Unit(Base):
    __tablename__ = "units"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), nullable=False, unique=True)
    abbreviation = Column(String(20), nullable=True)

    items = relationship("InventoryItem", back_populates="unit")

class InventoryLocation(Base):
    __tablename__ = "inventory_locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    transactions = relationship("InventoryTransaction", back_populates="location")

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(240), nullable=False)
    type_id = Column(Integer, ForeignKey("inventory_types.id"), nullable=False)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    cost_price = Column(Numeric(12,2), nullable=True)   # buying price default
    reorder_level = Column(Numeric(12,3), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    quantity_on_hand = Column(Integer, nullable=False, default=0)

    type = relationship("InventoryType", back_populates="items")
    unit = relationship("Unit", back_populates="items")
    transactions = relationship("InventoryTransaction", back_populates="item", cascade="all, delete-orphan")

    def current_stock(self, db):
        # efficient balanced sum of IN minus OUT
        from sqlalchemy.sql import func as sa_func
        in_q = db.query(sa_func.coalesce(sa_func.sum(InventoryTransaction.quantity), 0).label("qty")) \
            .filter(InventoryTransaction.item_id == self.id, InventoryTransaction.movement == "IN").first()
        out_q = db.query(sa_func.coalesce(sa_func.sum(InventoryTransaction.quantity), 0).label("qty")) \
            .filter(InventoryTransaction.item_id == self.id, InventoryTransaction.movement == "OUT").first()
        in_qty = float(in_q.qty or 0)
        out_qty = float(out_q.qty or 0)
        return in_qty - out_qty

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    movement = Column(String(10), nullable=False)  # "IN" or "OUT"
    quantity = Column(Numeric(12,3), nullable=False)
    unit_price = Column(Numeric(12,2), nullable=True)  # price for IN transactions
    location_id = Column(Integer, ForeignKey("inventory_locations.id", ondelete="SET NULL"), nullable=True)
    reference_type = Column(String(80), nullable=True)  # e.g., "Purchase", "HealthEvent"
    reference_id = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    item = relationship("InventoryItem", back_populates="transactions")
    location = relationship("InventoryLocation", back_populates="transactions")

    __table_args__ = (
        CheckConstraint("movement IN ('IN','OUT')", name="check_movement_in_out"),
    )

class PurchaseOrderStatus(enum.Enum):
    draft = "draft"
    ordered = "ordered"
    partial = "partial"
    received = "received"
      


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    order_date = Column(Date, nullable=False)
    expected_delivery_date = Column(Date, nullable=True)
    total_amount = Column(Numeric(12, 2), nullable=True, default=0)
    status = Column(Enum(PurchaseOrderStatus), default=PurchaseOrderStatus.draft)
    notes = Column(Text, nullable=True)

    vendor = relationship("Vendor", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="order", cascade="all, delete")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    item_id = Column(Integer, ForeignKey("inventory_items.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
    quantity_received = Column(Integer, nullable=False, default=0)
    order = relationship("PurchaseOrder", back_populates="items")
    item = relationship("InventoryItem")


# Goods Receipt (GRN)
class GoodsReceipt(Base):
    __tablename__ = "goods_receipts"
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    store_id = Column(Integer, nullable=False)
    received_date = Column(Date, nullable=False, server_default=func.current_date())
    received_by = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    purchase_order = relationship("PurchaseOrder")
    items = relationship("GoodsReceiptItem", back_populates="receipt", cascade="all, delete-orphan")

class GoodsReceiptItem(Base):
    __tablename__ = "goods_receipt_items"
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("goods_receipts.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    quantity_received = Column(Integer, nullable=False)
    cost_price = Column(Numeric(12,2), nullable=True)

    receipt = relationship("GoodsReceipt", back_populates="items")
    item = relationship("InventoryItem")
    store = relationship("Store")
class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    location_id = Column(Integer, nullable=False)   # store or boma id
    quantity = Column(Integer, nullable=False)      # + for receive, - for issue
    movement_type = Column(String, nullable=False)  # "RECEIPT", "ISSUE", "ADJUSTMENT"
    reference_type = Column(String, nullable=True)  # "goods_receipt", "purchase_order", etc.
    reference_id = Column(Integer, nullable=True)
    created_at = Column(Date, server_default=func.current_date())

    item = relationship("InventoryItem")    

# --- Stores (warehouses) ---
class Store(Base):
    __tablename__ = "stores"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    location = Column(String, nullable=True)
    description = Column(Text, nullable=True)    # Inventory movements ledger (source of truth)



class StoreInventory(Base):
    __tablename__ = "store_inventories"
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity = Column(Numeric, nullable=False, default=0)   # store-level qty
    avg_cost = Column(Numeric, nullable=True)               # average cost per unit in this store

    store = relationship("Store")
    item = relationship("InventoryItem")

    __table_args__ = (UniqueConstraint("store_id", "item_id", name="uix_store_item"),)



class IssueReceipt(Base):
    __tablename__ = "issue_receipts"
    id = Column(Integer, primary_key=True)
    source_store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    destination_store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    issued_by = Column(String, nullable=True)
    received_by = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
   