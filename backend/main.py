from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import models, schemas, database, auth
from auth import get_current_user, TokenData
import crud_livestock
from routers import reports
from routers import locations, owners, vendors, categories, species, livestock
from routers.health import diseases, medications, vets, event_types, events, healthreports
from routers import purchase
from routers import births , sales  ,buyers,sale_items, livestock_events,exit_router, farm    
from routers import inventory, livestock_history,inventory_setup,purchase_orders,inventory_receipts, stores
from routers.livestock_history import router as livestock_history_router

# --- Create tables ---

from database import engine
from models import Base

Base.metadata.create_all(bind=engine)


app = FastAPI()

origins = [
    "http://192.168.2.20",
    "http://192.168.0.115",
    "http://192.168.2.20:3000",
    "http://192.168.0.115:3000",
    "*",  # optional fallback
   
]

# --- CORS middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database dependency ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- User endpoints ---
@app.get("/me")
def read_users_me(current_user: TokenData = Depends(get_current_user)):
    return {"email": current_user.email}

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = auth.hash_password(user.password)
    new_user = models.User(username=user.username, email=user.email, password_hash=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth.create_access_token({"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}

# --- Livestock endpoints ---
@app.post("/livestock", response_model=schemas.LivestockResponse)
def add_livestock(livestock: schemas.LivestockCreate, db: Session = Depends(get_db)):
    try:
        db_livestock = crud_livestock.create_livestock(db, livestock)
        return db_livestock
    except IntegrityError as e:
        db.rollback()
        if "livestock_tag_number_key" in str(e.orig):
            raise HTTPException(status_code=400, detail="Tag number already exists")
        else:
            raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/livestock", response_model=List[schemas.LivestockResponse])
def get_livestock(db: Session = Depends(get_db)):
    return db.query(models.Livestock).all()


app.include_router(locations.router, prefix="/locations", tags=["Locations"])
# Include the router
app.include_router(farm.router)
app.include_router(owners.router)
app.include_router(vendors.router)
app.include_router(buyers.router)

app.include_router(categories.router)


app.include_router(species.router)

app.include_router(livestock.router)
app.include_router(livestock_events.router)

app.include_router(livestock_history_router)
# include health routers
app.include_router(diseases.router)
app.include_router(medications.router)
app.include_router(vets.router)
app.include_router(event_types.router)
app.include_router(events.router)
app.include_router(healthreports.router)


app.include_router(purchase.router)
app.include_router(purchase_orders.router)
app.include_router(births.router)
app.include_router(sales.router)
app.include_router(sale_items.router)
app.include_router(exit_router.router)
app.include_router(inventory_setup.router)
app.include_router(inventory.router)
app.include_router(inventory_receipts.router)
app.include_router(inventory_receipts.router)
app.include_router(stores.router)

# --- Include routers ---
app.include_router(reports.router)
