from sqlalchemy.orm import Session
import models, schemas
from datetime import date

def determine_category(species, sex, dob, castrated):
    age_months = (date.today().year - dob.year) * 12 + (date.today().month - dob.month)

    if species == "cow":
        if age_months < 12:
            return "Calf (Male)" if sex == "male" else "Calf (Female)"
        if sex == "male":
            return "Steer" if castrated else "Bull"
        if sex == "female":
            return "Heifer" if age_months < 24 else "Cow"

    elif species == "sheep":
        if age_months < 12:
            return "Lamb"
        return "Wether" if sex == "male" and castrated else ("Ram" if sex == "male" else "Ewe")

    elif species == "goat":
        if age_months < 12:
            return "Kid"
        return "Wether" if sex == "male" and castrated else ("Buck" if sex == "male" else "Doe")

    return "Unknown"

def create_livestock(db: Session, livestock: schemas.LivestockCreate):
    category = determine_category(livestock.species, livestock.sex, livestock.dob, livestock.castrated)
    db_livestock = models.Livestock(
        species=livestock.species,
        sex=livestock.sex,
        dob=livestock.dob,
        castrated=livestock.castrated,
        category=category,
        notes=livestock.notes,
        tag_number=livestock.tag_number,
        owner_name=livestock.owner_name
    )
    db.add(db_livestock)
    db.commit()
    db.refresh(db_livestock)
    return db_livestock

def get_livestock(db: Session, skip: int = 0, limit: int = 50):
    return db.query(models.Livestock).offset(skip).limit(limit).all()
