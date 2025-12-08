# backend/reports/livestock_report.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML
import io
import base64
import datetime
import os

from database import get_db
import models

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

# adjust this path if your templates live elsewhere
BASE_DIR = os.path.dirname(__file__)
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html", "xml"])
)


def build_livestock_payload(db: Session):
    """
    Query DB for livestock and their relationships (species, owner, category).
    Adapt the attribute names if your relationships use different property names.
    """
    q = (
        db.query(models.Livestock)
        .options(
            joinedload(models.Livestock.species),   # -> models.Species
            joinedload(models.Livestock.owner),     # -> models.Owner
            joinedload(models.Livestock.category),  # -> models.Category
            joinedload(models.Livestock.events),
            joinedload(models.Livestock.movements),
        )
        .order_by(models.Livestock.tag_number)
    )

    payload = []
    for a in q.all():
        payload.append({
            "id": a.id,
            "tag_number": a.tag_number or "",
            "species": getattr(a.species, "name", "") if getattr(a, "species", None) else "",
            "sex": a.sex or "",
            "category": getattr(a.category, "name", "") if getattr(a, "category", None) else "",
            "dob": a.dob.isoformat() if getattr(a, "dob", None) else "",
            "owner": getattr(a.owner, "name", "") if getattr(a, "owner", None) else "",
            "status": a.availability or "",
            "notes": a.notes or "",
            # optionally include events/movements if you want them in the report:
            "events": [
                {
                    "event_type": ev.event_type,
                    "event_date": ev.event_date.isoformat() if ev.event_date else None,
                    "notes": ev.notes,
                }
                for ev in sorted(a.events, key=lambda e: e.event_date or datetime.date.min)
            ],
            "movements": [
                {
                    "movement_type": mv.movement_type,
                    "movement_date": mv.movement_date.isoformat() if mv.movement_date else None,
                    "source": mv.source,
                    "destination": mv.destination,
                    "notes": mv.notes,
                }
                for mv in sorted(a.movements, key=lambda m: m.movement_date or datetime.date.min)
            ],
        })
    return payload


@router.get("/livestock", summary="Download livestock report (PDF)")
def livestock_report(db: Session = Depends(get_db)):
    """
    Returns a generated A4 PDF (WeasyPrint) listing livestock.
    Uses templates/livestock_report.html in backend/templates/.
    """
    # load template
    template_name = "livestock_report.html"
    try:
        template = env.get_template(template_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template load error: {e}")

    # query DB and assemble payload
    livestock = build_livestock_payload(db)

    # fetch farm info if you have a Farm model; else fallback
    farm = {"name": "Farm"}  # replace with a DB fetch if available

    # Embed logo as base64 so it works inside Docker
    logo_rel = os.path.join(BASE_DIR, "static", "logo.png")
    logo_data_uri = ""
    if os.path.exists(logo_rel):
        with open(logo_rel, "rb") as f:
            logo_b64 = base64.b64encode(f.read()).decode("ascii")
        logo_data_uri = f"data:image/png;base64,{logo_b64}"

    html = template.render(
        farm=farm,
        livestock=livestock,
        date=datetime.date.today().isoformat(),
        logo_path=logo_data_uri
    )

    # Convert HTML to PDF bytes
    try:
        pdf_bytes = HTML(string=html).write_pdf()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"WeasyPrint error: {e}")

    # Stream the PDF back
    return StreamingResponse(io.BytesIO(pdf_bytes),
                            media_type="application/pdf",
                            headers={"Content-Disposition": "attachment; filename=livestock_report.pdf"})
