from sqlalchemy import Column, Integer, String, ForeignKey,  Date, Enum, Boolean
import enum
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

class SpeciesEnum(str, enum.Enum):
    cow = "cow"
    sheep = "sheep"
    goat = "goat"


class SexEnum(str, enum.Enum):
    male = "male"
    female = "female"


class Livestock(Base):
    __tablename__ = "livestock"

    id = Column(Integer, primary_key=True, index=True)
    species = Column(Enum(SpeciesEnum), nullable=False)   # cow, sheep, goat
    sex = Column(Enum(SexEnum), nullable=False)           # male, female
    dob = Column(Date, nullable=False)                    # date of birth
    castrated = Column(Boolean, default=False)            # for males
    category = Column(String, index=True)                 # calf, bull, heifer, ewe, kid, etc.
    status = Column(String, default="active")             # active, sold, dead
    notes = Column(String, nullable=True)                 # optional notes
    tag_number = Column(String, nullable=False, unique=True)  # unique tag for each animal
    owner_name = Column(String, nullable=False)

