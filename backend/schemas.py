from pydantic import BaseModel, EmailStr , model_validator
from datetime import date
from typing import Optional

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


class LivestockResponse(LivestockBase):
    id: int

    class Config:
        orm_mode = True