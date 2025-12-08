from pydantic import BaseModel, EmailStr , model_validator,condecimal
from datetime import date, datetime
from typing import Optional, List,Literal
from decimal import Decimal

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True




# Species
class SpeciesBase(BaseModel):
    name: str

class SpeciesCreate(SpeciesBase):
    pass

class Species(SpeciesBase):
    id: int
    class Config:
        orm_mode = True

# Category
class CategoryBase(BaseModel):
    name: str
    species_id: int

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    class Config:
        orm_mode = True

# Location
class LocationBase(BaseModel):
    name: str

class LocationCreate(LocationBase):
    pass

class LocationResponse(LocationBase):
    id: int
    class Config:
        orm_mode = True

# Owner
class OwnerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class OwnerCreate(OwnerBase):
    pass

class OwnerResponse(OwnerBase):
    id: int
    class Config:
        orm_mode = True

class LivestockBase(BaseModel):
    tag_number: str
    species_id: Optional[int] = None
    category_id: Optional[int] = None
    owner_id: Optional[int] = None
    location_id: Optional[int] = None
    sex: Optional[str] = None
    dob: Optional[date] = None
    castrated: Optional[bool] = False
    purchase_id: Optional[int] = None
    purchase_price: Optional[float] = None
    origin: Optional[str] = None


class LivestockCreate(LivestockBase):
    event_type: Optional[str] = None
    event_date: Optional[date] = None

class LivestockResponse(LivestockBase):
    id: int
    latest_event: Optional["LivestockEventResponse"] = None
    availability: str

    class Config:
        from_attributes = True


# ------------------ Diseases ------------------ #
class DiseaseBase(BaseModel):
    name: str
    description: Optional[str] = None


class DiseaseCreate(DiseaseBase):
    pass


class DiseaseUpdate(DiseaseBase):
    pass


class Disease(DiseaseBase):
    id: int

    class Config:
        orm_mode = True


# ------------------ Medications ------------------ #
class MedicationBase(BaseModel):
    name: str
    description: Optional[str] = None
    dosage: Optional[str] = None

class MedicationCreate(MedicationBase):
    pass

class MedicationUpdate(MedicationBase):
    pass

class MedicationResponse(MedicationBase):
    id: int

    class Config:
        orm_mode = True


# ------------------ Vets ------------------ #
class VetBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class VetCreate(VetBase):
    pass

class VetUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class VetResponse(VetBase):
    id: int

    class Config:
        orm_mode = True


class HealthEventTypeBase(BaseModel):
    name: str
    description: str | None = None


class HealthEventTypeCreate(HealthEventTypeBase):
    pass


class HealthEventTypeUpdate(HealthEventTypeBase):
    pass


class HealthEventType(HealthEventTypeBase):
    id: int

    class Config:
        orm_mode = True

# schemas.py



class HealthEventBase(BaseModel):
    date: date
    livestock_id: int
    event_type_id: int
    disease_id: Optional[int] = None
    medication_id: Optional[int] = None
    vet_id: Optional[int] = None
    notes: Optional[str] = None

class HealthEventCreate(HealthEventBase):
    pass

class HealthEventUpdate(HealthEventBase):
    pass

class HealthEvent(HealthEventBase):
    id: int

    class Config:
        orm_mode = True
class VendorBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class VendorCreate(VendorBase):
    pass


class VendorResponse(VendorBase):
    id: int

    class Config:
        orm_mode = True

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
       

# ------------------ Purchase & Items ------------------ #



class AnimalCreate(BaseModel):   # <-- for PurchaseItem
    tag_number: str
    species_id: int
    category_id: int
    owner_id: int
    location_id: int
    sex: str
    dob: Optional[date]
    price: float
    notes: Optional[str] = None

class AnimalResponse(BaseModel):
    id: int
    tag_number: str
    species_id: int
    category_id: int
    owner_id: int
    location_id: int
    sex: str
    dob: Optional[date]
    price: float
    notes: Optional[str] = None
    created_at: datetime
    livestock: Optional[LivestockResponse] = None  

    class Config:
        orm_mode = True



# --- Purchase Items ---
class PurchaseItemBase(BaseModel):
    tag_number: str
    species_id: int
    category_id: int
    owner_id: int
    location_id: Optional[int] = None
    sex: Optional[str] = None
    dob: Optional[date] = None
    price: float
    notes: Optional[str] = None

class PurchaseItemCreate(PurchaseItemBase):
    pass

class PurchaseItemResponse(PurchaseItemBase):
    id: int
    livestock_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Purchase ---
class PurchaseBase(BaseModel):
    reference: Optional[str] = None
    vendor_id: int 
    purchase_date: date
    total_cost: Optional[float] = None
    notes: Optional[str] = None

class PurchaseCreate(BaseModel):
    vendor_id: str
    purchase_date: date
    total_cost: float
    notes: Optional[str]
    items: List[PurchaseItemBase]

class LivestockEventResponse(BaseModel):
    id: int
    livestock_id: int
    event_type: Optional[str] = None
    purchase_id: Optional[int] = None
    sale_id: Optional[int] = None
    exit_id: Optional[int] = None
    event_date: date
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class PurchaseResponse(BaseModel):
    id: int
    
    purchase_date: date
    total_cost: float
    notes: Optional[str]
    items: List[PurchaseItemResponse] = []
    events: Optional[List[LivestockEventResponse]] = None 

    class Config:
        from_attributes = True

class AnimalCreate(BaseModel):   # <-- for PurchaseItem
    tag_number: str
    species_id: int
    category_id: int
    owner_id: int
    location_id: int
    sex: str
    dob: Optional[date]
    price: float
    notes: Optional[str] = None


class AnimalResponse(AnimalCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True






#BIRTHS AND PARENTAGE
# --- Birth Schemas ---


class BirthCreate(BaseModel):
    tag_number: str
    birth_date: date
    sex: str
    species_id: int
    owner_id: int
    location_id: int
    sire_id: Optional[int] = None
    dam_id: Optional[int] = None
    notes: Optional[str] = None


class BirthResponse(BaseModel):
    id: int
    tag_number: str
    dob: date
    sex: str
    notes: Optional[str]
    sire: Optional[dict] = None
    dam: Optional[dict] = None
    latest_event: Optional[LivestockEventResponse]

    class Config:
        orm_mode = True

class ParentageBase(BaseModel):
    calf_id: int
    sire_id: int
    dam_id: int
    notes: Optional[str] = None   # 👈 removed birth_date


class ParentageResponse(ParentageBase):
    id: int
    calf: Optional[LivestockResponse]
    sire: Optional[LivestockResponse]
    dam: Optional[LivestockResponse]

    class Config:
        from_attributes = True

# ---------------- Buyer ----------------
class BuyerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class BuyerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class BuyerResponse(BuyerCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True




# ---------------- Sale Items ----------------
class SaleItemBase(BaseModel):
    livestock_id: int
    price: float


class SaleItemCreate(SaleItemBase):
    pass  # 👈 keep only one definition


class SaleItemUpdate(BaseModel):
    livestock_id: Optional[int] = None
    price: Optional[float] = None

    class Config:
        orm_mode = True



class SaleItemResponse(SaleItemBase):
    id: int
    sale_id: int
    created_at: datetime
    livestock: Optional[LivestockResponse]  # 👈 this will expand tag_number etc.

    class Config:
        from_attributes = True

# ---------------- Sale ----------------
class SaleBase(BaseModel):
    buyer_id: int
    sale_date: date
    total_amount: float
    notes: Optional[str] = None


class SaleCreate(SaleBase):
    items: List[SaleItemCreate]


class SaleResponse(SaleBase):
    id: int
    created_at: datetime
    buyer: BuyerResponse
    items: List[SaleItemResponse] = []
    events: Optional[List[LivestockEventResponse]] = None
    
    class Config:
        from_attributes = True



class LivestockEventBase(BaseModel):
    event_type: str
    event_date: Optional[date] = None
    notes: Optional[str] = None
    related_id: Optional[int] = None


class LivestockEventCreate(LivestockEventBase):
    livestock_id: int

from typing import Literal

class ExitCreate(BaseModel):
    tag_number: str 
    exit_type: Literal["death", "slaughter"]
    reason: str | None = None

class ExitResponse(BaseModel):
    id: int
    livestock_id: int
    exit_type: str
    reason: str | None
    created_at: datetime

    class Config:
        orm_mode = True


class FarmBase(BaseModel):
    name: str
    owner_name: Optional[str] = None
    location: Optional[str] = None
    contact: Optional[str] = None

class FarmCreate(FarmBase):
    pass

class FarmResponse(FarmBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True




class LivestockMovementSummary(BaseModel):
    movement_type: Optional[str]
    movement_date: Optional[date]
    source: Optional[str]
    destination: Optional[str]
    notes: Optional[str] = None

class LivestockEventSummary(BaseModel):
    event_type: Optional[str]
    event_date: Optional[date]
    notes: Optional[str]

class LivestockHistoryResponse(BaseModel):
    id: int
    tag_number: str
    species_id: Optional[int]
    category_id: Optional[int]
    owner_id: Optional[int]
    availability: Optional[str]
    status: Optional[str]
    last_movement: Optional[LivestockMovementSummary]
    last_event: Optional[LivestockEventSummary]
    events: List[LivestockEventSummary]
    movements: List[LivestockMovementSummary]

    class Config:
        orm_mode = True


class BuyerPurchaseItem(BaseModel):
    tag_number: str
    species: Optional[str]
    category: Optional[str]
    purchase_date: date
    price: float

    class Config:
        from_attributes = True 


class BuyerHistoryResponse(BaseModel):
    buyer_id: int
    buyer_name: str
    phone: Optional[str]
    total_spent: float
    purchases: List[BuyerPurchaseItem]

    class Config:
        from_attributes = True


class VendorPurchaseItem(BaseModel):
    tag_number: str
    species: Optional[str]
    category: Optional[str]
    purchase_date: date
    price: float

    class Config:
        orm_mode = True


class VendorHistoryResponse(BaseModel):
    vendor_id: int
    vendor_name: str
    phone: Optional[str]
    total_spent: float
    purchases: List[VendorPurchaseItem]

    class Config:
        orm_mode = True



# 1️⃣ Inventory Type
class InventoryTypeBase(BaseModel):
    name: str
    description: Optional[str] = None

class InventoryTypeCreate(InventoryTypeBase):
    pass

class InventoryTypeResponse(InventoryTypeBase):
    id: int
    class Config:
        orm_mode = True


# 2️⃣ Unit of Measure
class UnitBase(BaseModel):
    name: str
    abbreviation: str

class UnitCreate(UnitBase):
    pass

class UnitResponse(UnitBase):
    id: int
    class Config:
        orm_mode = True


# 3️⃣ Inventory Item
class InventoryItemBase(BaseModel):
    name: str
    type_id: int
    unit_id: int
    cost_price: Optional[condecimal(max_digits=12, decimal_places=2)] = None
    notes: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemResponse(InventoryItemBase):
    id: int
    created_at: Optional[datetime] = None
    type_name: Optional[str] = None
    unit_name: Optional[str] = None
    class Config:
        orm_mode = True


# 4️⃣ Inventory Transaction
class InventoryTransactionBase(BaseModel):
    item_id: int
    transaction_type: str   # "IN" or "OUT"
    quantity: float
    location_id: Optional[int] = None
    reference_type: Optional[str] = None  # e.g. "Purchase", "HealthEvent"
    reference_id: Optional[int] = None
    date: Optional[date] = None
    notes: Optional[str] = None

class InventoryTransactionCreate(InventoryTransactionBase):
    pass

class InventoryTransactionResponse(InventoryTransactionBase):
    id: int
    created_at: Optional[datetime] = None
    class Config:
        orm_mode = True


# 5️⃣ Stock Summary
class InventoryStockResponse(BaseModel):
    item_id: int
    item_name: str
    available_stock: float
    unit_id: Optional[int]



class PurchaseOrderItemBase(BaseModel):
    item_id: int
    quantity: int
    unit_price: Decimal
    

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItemResponse(PurchaseOrderItemBase):
    id: int
    item: InventoryItemResponse  # include nested item
    quantity: int
    unit_price: float
    class Config:
        orm_mode = True


class PurchaseOrderBase(BaseModel):
    vendor_id: int
    order_date: date
    expected_delivery_date: Optional[date] = None
    total_amount: Optional[Decimal] = 0
    status: Optional[str] = "draft"
    notes: Optional[str] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    vendor: VendorResponse
    items: List[PurchaseOrderItemResponse]
    status: str
    class Config:
        orm_mode = True  

class StoreCreate(BaseModel):
    name: str
    location: Optional[str] = None
    description: Optional[str] = None

class StoreResponse(StoreCreate):
    id: int
    class Config:
        orm_mode = True          

class GoodsReceiptItemCreate(BaseModel):
    item_id: int
    quantity_received: int
    cost_price: Optional[Decimal] = None

class GoodsReceiptCreate(BaseModel):
    purchase_order_id: Optional[int] = None
    store_id: int
    received_by: Optional[str] = None
    notes: Optional[str] = None
    items: List[GoodsReceiptItemCreate]

class GoodsReceiptItemResponse(GoodsReceiptItemCreate):
    id: int
    class Config:
        orm_mode = True

class GoodsReceiptResponse(BaseModel):
    id: int
    purchase_order_id: Optional[int]
    store_id: int
    received_date: date
    received_by: Optional[str]
    notes: Optional[str]
    items: List[GoodsReceiptItemResponse]
    class Config:
        orm_mode = True


class StockResponse(BaseModel):
    item_id: int
    item_name: str
    quantity_on_hand: float

    class Config:
           from_attributes = True


class IssueItemCreate(BaseModel):
    item_id: int
    quantity: float
    cost_price: Optional[float] = None  # optional override; otherwise last cost used

class IssueCreate(BaseModel):
    source_store_id: int
    destination_store_id: int
    issued_by: Optional[str] = None
    received_by: Optional[str] = None
    notes: Optional[str] = None
    items: List[IssueItemCreate]

class IssueReceiptItem(BaseModel):
    item_id: int
    quantity: float
    cost_price: Optional[float] = None

class IssueReceiptResponse(BaseModel):
    id: Optional[int] = None
    source_store_id: int
    destination_store_id: int
    issued_by: Optional[str]
    received_by: Optional[str]
    notes: Optional[str]
    items: List[IssueReceiptItem]

    class Config:
        from_attributes = True 
class IssueStockResponse(BaseModel):
    success: bool
    message: str
                 

class IssueItem(BaseModel):
    item_id: int
    quantity: int
    cost_price: Optional[float] = None

class IssueStockRequest(BaseModel):
    source_store_id: int
    destination_store_id: int
    issued_by: Optional[str] = None
    received_by: Optional[str] = None
    notes: Optional[str] = None
    items: List[IssueItem]
