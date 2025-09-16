from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database, auth
from auth import get_current_user, TokenData

router = APIRouter(
    prefix="/livestock",
    tags=["Livestock"]
)

# Dependency for DB
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.LivestockResponse)
def create_livestock(livestock: schemas.LivestockCreate,
                     db: Session = Depends(get_db),
                     current_user: TokenData = Depends(get_current_user)):

    new_livestock = models.Livestock(
        name=livestock.name,
        type=livestock.type,
        age=livestock.age,
        owner_email=current_user.email
    )
    db.add(new_livestock)
    db.commit()
    db.refresh(new_livestock)
    return new_livestock


@router.get("/")
def get_livestock(db: Session = Depends(get_db),
                  current_user: TokenData = Depends(get_current_user)):
    return db.query(models.Livestock).filter(models.Livestock.owner_email == current_user.email).all()
