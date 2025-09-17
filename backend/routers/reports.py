from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import tempfile, datetime

import models, database

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie

router = APIRouter(prefix="/reports", tags=["Reports"])

# --- DB dependency ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/daily")
def generate_daily_report(db: Session = Depends(get_db)):
    livestock = db.query(models.Livestock).all()

    # --- Count by species ---
    species_counts = {}
    for animal in livestock:
        if not animal.species:
            continue
        species_counts[animal.species] = species_counts.get(animal.species, 0) + 1

    # --- Count by owner ---
    owner_counts = {}
    for animal in livestock:
        if not animal.owner_name:
            continue
        owner_counts[animal.owner_name] = owner_counts.get(animal.owner_name, 0) + 1

    # --- Daily events ---
    today = datetime.date.today()
    events_today = {"born": 0, "bought": 0, "sold": 0, "died": 0}
    for animal in livestock:
        if getattr(animal, "event_type", None) and getattr(animal, "event_date", None):
            if animal.event_date.date() == today and animal.event_type in events_today:
                events_today[animal.event_type] += 1

    # --- Define categories ---
    categories_map = {
        "cow": ["Calf (Male)", "Calf (Female)", "Bull", "Steer", "Heifer", "Cow"],
        "sheep": ["Lamb", "Ram", "Wether", "Ewe"],
        "goat": ["Kid", "Buck", "Wether", "Doe"],
    }
    species_category_counts = {sp: {cat: 0 for cat in cats} for sp, cats in categories_map.items()}

    # --- Categorize ---
    from datetime import date
    def determine_category(species, sex, dob, castrated):
        if not dob:
            return "Unknown"
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

    for animal in livestock:
        category = determine_category(
            animal.species, animal.sex, getattr(animal, "dob", None), getattr(animal, "castrated", False)
        )
        if animal.species in species_category_counts and category in species_category_counts[animal.species]:
            species_category_counts[animal.species][category] += 1

    # --- PDF setup ---
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    doc = SimpleDocTemplate(temp_file.name, pagesize=A4)

    styles = getSampleStyleSheet()
    story = []

    # --- Title ---
    story.append(Paragraph("Farm Daily Livestock Report", styles["Heading1"]))
    story.append(Paragraph(f"Date: {today.strftime('%B %d, %Y')}", styles["Normal"]))
    story.append(Spacer(1, 20))

    # --- Grand total ---
    total_livestock = len(livestock)
    story.append(Paragraph(f"<b>Total Livestock:</b> {total_livestock}", styles["Normal"]))
    story.append(Spacer(1, 10))

    # Utility function for styled tables
    def styled_table(data, header_color="#4CAF50"):
        table = Table(data, hAlign="LEFT")
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(header_color)),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 12),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("FONTSIZE", (0, 1), (-1, -1), 10),
                ]
            )
        )
        return table

    # --- Events ---
    story.append(Paragraph("Livestock Movements Today", styles["Heading2"]))
    events_data = [["Event", "Count"]] + [[k.capitalize(), v] for k, v in events_today.items()]
    if len(events_data) == 1:
        events_data.append(["No events", 0])
    story.append(styled_table(events_data, header_color="#FF9800"))
    story.append(Spacer(1, 20))

    # --- Species totals (Bar Graph instead of Table) ---
    story.append(Paragraph("Livestock by Species", styles["Heading2"]))

    if species_counts:
        drawing = Drawing(400, 200)
        data = [list(species_counts.values())]

        bc = VerticalBarChart()
        bc.x = 50
        bc.y = 30
        bc.height = 150
        bc.width = 300
        bc.data = data
        bc.strokeColor = colors.black

        bc.valueAxis.valueMin = 0
        bc.valueAxis.valueStep = max(1, max(species_counts.values()) // 5)
        bc.valueAxis.labelTextFormat = "%d"

        bc.categoryAxis.categoryNames = [s.capitalize() for s in species_counts.keys()]
        bc.categoryAxis.labels.angle = 45
        bc.categoryAxis.labels.dy = -15
        bc.categoryAxis.labels.fontName = "Helvetica"
        bc.categoryAxis.labels.fontSize = 9

        bc.bars[0].fillColor = colors.HexColor("#4CAF50")

        drawing.add(bc)
        story.append(drawing)
    else:
        story.append(Paragraph("No data available", styles["Normal"]))

    story.append(Spacer(1, 20))

    # --- Species categories ---
    story.append(Paragraph("Livestock by Categories", styles["Heading2"]))
    cat_data = [["Species", "Category", "Count"]]
    for sp, categories in species_category_counts.items():
        for cat, count in categories.items():
            cat_data.append([sp.capitalize(), cat, count])
    if len(cat_data) == 1:
        cat_data.append(["-", "No data", 0])
    story.append(styled_table(cat_data, header_color="#9C27B0"))
    story.append(Spacer(1, 20))

    # --- Owners ---
    story.append(Paragraph("Livestock by Owner", styles["Heading2"]))
    owner_data = [["Owner", "Count"]] + [[o, c] for o, c in owner_counts.items()]
    if len(owner_data) == 1:
        owner_data.append(["No data", 0])
    story.append(styled_table(owner_data, header_color="#2196F3"))
    story.append(Spacer(1, 20))

    # --- Footer ---
    story.append(
        Paragraph(
            "Auto-generated by Farm Management System",
            ParagraphStyle("footer", parent=styles["Normal"], textColor=colors.grey, fontSize=9),
        )
    )

    doc.build(story)

    return FileResponse(
        temp_file.name,
        filename=f"daily_report_{today}.pdf",
        media_type="application/pdf",
    )
