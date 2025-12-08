# services/store_service.py
from sqlalchemy.orm import Session
from models import Store

def ensure_main_store(db: Session):
    main = db.query(Store).filter(Store.name == "Main Store").first()
    if not main:
        main = Store(name="Main Store", location="Head Office", description="Default main store")
        db.add(main)
        db.commit()
        db.refresh(main)
    return main
