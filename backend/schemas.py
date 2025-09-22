from pydantic import BaseModel, EmailStr , model_validator
from datetime import date
from typing import Optional, List

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
    species_id: int
    category_id: int
    owner_id: int
    location_id: int
    sex: str
    dob: Optional[date]
    castrated: Optional[bool] = False
    status: str
    event_type: Optional[str] = None
    event_date: Optional[date] = None


class LivestockCreate(LivestockBase):
    pass


class LivestockResponse(BaseModel):
    id: int
    tag_number: str
    species_id: int
    category_id: int
    owner_id: int
    location_id: int
    sex: str
    dob: date
    castrated: bool
    status: str
    event_type: Optional[str] = None
    event_date: Optional[date] = None
    purchase_id: Optional[int] = None   # NEW

    class Config:
        orm_mode = True


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

