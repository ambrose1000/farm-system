from sqlalchemy import Column, Integer, String, ForeignKey, Date, Enum, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base
import enum

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
    sex = Column(String)
    dob = Column(Date)
    castrated = Column(Boolean, default=False)
    status = Column(String)
    event_type = Column(String)
    event_date = Column(Date)

    # relationships
    species = relationship("Species", back_populates="livestock")
    category = relationship("Category", back_populates="livestock")
    owner = relationship("Owner", back_populates="livestock")
    location = relationship("Location", back_populates="livestock")


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
