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



class LivestockBase(BaseModel):
    species: str
    sex: str
    dob: Optional[date] = None
    age_years: Optional[int] = None
    castrated: bool
    category: str
    status: str
    notes: Optional[str] = None
    tag_number: str
    owner_name: str

    @model_validator(mode="before")
    def calculate_dob(cls, values):
        # Case 1: values is a dict (from request body)
        if isinstance(values, dict):
            dob = values.get("dob")
            age_years = values.get("age_years")
            if not dob and age_years is not None:
                today = date.today()
                values["dob"] = today - timedelta(days=age_years * 365)
            elif not dob and age_years is None:
                raise ValueError("Either dob or age_years must be provided")
        return values
class LivestockCreate(LivestockBase):
    pass

class LivestockResponse(LivestockBase):
    id: int
    category: Optional[str]
    status: str

    class Config:
        orm_mode = True
