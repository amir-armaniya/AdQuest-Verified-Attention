from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import os

OUTPUT = os.path.expanduser("~/Project/AdQuest-Verified-Attention--deploy/AdQuest-PitchDeck.pdf")

# Colors
BG = HexColor("#050508")
CARD = HexColor("#0d1117")
BLUE = HexColor("#58a6ff")
GREEN = HexColor("#3fb950")
PURPLE = HexColor("#bc8cff")
GRAY = HexColor("#8b949e")
WHITE = HexColor("#e6edf3")

styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle('Title2', parent=styles['Title'], fontSize=28, textColor=WHITE, spaceAfter=12, alignment=TA_CENTER, fontName='Helvetica-Bold')
subtitle_style = ParagraphStyle('Subtitle2', parent=styles['Normal'], fontSize=14, textColor=GRAY, spaceAfter=20, alignment=TA_CENTER)
heading_style = ParagraphStyle('Heading2', parent=styles['Heading2'], fontSize=18, textColor=BLUE, spaceAfter=8, spaceBefore=20, fontName='Helvetica-Bold')
body_style = ParagraphStyle('Body2', parent=styles['Normal'], fontSize=11, textColor=WHITE, spaceAfter=8, leading=16)
stat_style = ParagraphStyle('Stat', parent=styles['Normal'], fontSize=36, textColor=GREEN, alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=4)
stat_label = ParagraphStyle('StatLabel', parent=styles['Normal'], fontSize=10, textColor=GRAY, alignment=TA_CENTER, spaceAfter=16)
small_style = ParagraphStyle('Small', parent=styles['Normal'], fontSize=9, textColor=GRAY, spaceAfter=4)

def make_stat_table(data):
    """Create a row of stats"""
    cells = []
    for value, label in data:
        cell_content = [
            Paragraph(f'<font size="28" color="#3fb950"><b>{value}</b></font>', ParagraphStyle('s', alignment=TA_CENTER, spaceAfter=4)),
            Paragraph(f'<font size="9" color="#8b949e">{label}</font>', ParagraphStyle('s', alignment=TA_CENTER, spaceAfter=0))
        ]
        cells.append(cell_content)
    
    t = Table([cells], colWidths=[150]*len(data))
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    return t

def build():
    doc = SimpleDocTemplate(OUTPUT, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm)
    story = []

    # === SLIDE 1: Title ===
    story.append(Spacer(1, 2*cm))
    story.append(Paragraph("AdQuest", ParagraphStyle('big', fontSize=48, textColor=BLUE, alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=8)))
    story.append(Paragraph("Verified Attention Protocol", ParagraphStyle('sub', fontSize=20, textColor=WHITE, alignment=TA_CENTER, spaceAfter=24)))
    story.append(Paragraph("Stop paying for bots. Verified human attention, gamified.", subtitle_style))
    story.append(Spacer(1, 1*cm))
    
    stats = make_stat_table([
        ("93", "Real Users Tested"),
        ("2x", "Engagement Lift"),
        ("100%", "Video Completion"),
    ])
    story.append(stats)
    story.append(Spacer(1, 1.5*cm))
    story.append(Paragraph("v9.0 — Alpha Live | adquest.tech", ParagraphStyle('footer', fontSize=10, textColor=GRAY, alignment=TA_CENTER)))
    story.append(Paragraph("Amir Hossein Arman Nia — Product Architect", ParagraphStyle('footer2', fontSize=10, textColor=GRAY, alignment=TA_CENTER, spaceBefore=8)))

    # === SLIDE 2: Problem ===
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph("The Problem", heading_style))
    story.append(Paragraph("Mobile ads are broken. Users hate them, advertisers waste money, publishers lose users.", body_style))
    story.append(Spacer(1, 0.5*cm))
    
    problem_data = [
        ['Metric', 'Industry Standard', 'Problem'],
        ['Forced Video Completion', '65-75%', 'Users skip or close immediately'],
        ['Average Engagement', '5-7 seconds', 'Passive viewing, no real attention'],
        ['Ad Blocker Usage', '30-40%', 'Growing resistance to ads'],
        ['User Friction Score', '9.2/10', 'Interruptive, hated experience'],
    ]
    t = Table(problem_data, colWidths=[130, 100, 180])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HexColor("#161b22")),
        ('TEXTCOLOR', (0,0), (-1,0), BLUE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,1), (-1,-1), WHITE),
        ('BACKGROUND', (0,1), (-1,-1), CARD),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor("#21262d")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t)

    # === SLIDE 3: Solution ===
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph("The Solution: AdQuest", heading_style))
    story.append(Paragraph("Turn ads into a game. Users choose to engage because the challenge is part of the experience.", body_style))
    story.append(Spacer(1, 0.5*cm))
    
    steps = [
        ("1. Mystery Primer", "User sees a category prompt ('Find the Shoe'). Creates curiosity gap."),
        ("2. Video Playback", "Brand video plays in full. No skip button. Users watch voluntarily."),
        ("3. Eagle Eye Challenge", "Quick verification: 'Which product was it?' Hold-to-confirm."),
        ("4. Variable Reward", "Gold/Silver/Bronze tier based on attention quality. Real in-game rewards."),
    ]
    for title, desc in steps:
        story.append(Paragraph(f'<font color="#58a6ff"><b>{title}</b></font>', body_style))
        story.append(Paragraph(f'<font color="#8b949e">{desc}</font>', small_style))
        story.append(Spacer(1, 4))

    # === SLIDE 4: Results ===
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Real A/B Testing Results", heading_style))
    story.append(Paragraph("93 unique users. Developer sessions excluded. All data verified.", body_style))
    story.append(Spacer(1, 0.3*cm))
    
    results = [
        ['Metric', 'Control', 'AdQuest', 'Lift'],
        ['Avg. Engagement', '6.9s', '13.7s', '2.0x'],
        ['Video Completion', 'N/A', '100%', '—'],
        ['Full Flow Completion', 'N/A', '18.4%', '—'],
        ['Unique Users', '36', '51', '—'],
    ]
    t2 = Table(results, colWidths=[130, 80, 80, 80])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HexColor("#161b22")),
        ('TEXTCOLOR', (0,0), (-1,0), GREEN),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('TEXTCOLOR', (0,1), (-1,-1), WHITE),
        ('BACKGROUND', (0,1), (-1,-1), CARD),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor("#21262d")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TEXTCOLOR', (3,1), (3,1), GREEN),
        ('FONTNAME', (3,1), (3,1), 'Helvetica-Bold'),
    ]))
    story.append(t2)
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph('<font color="#8b949e">Source: verified-metrics.csv — Developer sessions (81) excluded based on frequency analysis</font>', small_style))

    # === SLIDE 5: Unit Economics ===
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Unit Economics", heading_style))
    story.append(Paragraph("Revenue scales with verified attention quality. Higher engagement = higher CPM.", body_style))
    story.append(Spacer(1, 0.3*cm))
    
    econ = [
        ['Tier', 'Behavior', 'CPM', 'Source'],
        ['A (Gold)', '1st try, no hints', '$7.00', 'Premium'],
        ['B (Silver)', '<2 attempts', '$4.00', 'Standard'],
        ['C (Bronze)', 'Completed', 'Market Rate', 'Safe Share'],
    ]
    t3 = Table(econ, colWidths=[70, 120, 80, 100])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HexColor("#161b22")),
        ('TEXTCOLOR', (0,0), (-1,0), PURPLE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('TEXTCOLOR', (0,1), (-1,-1), WHITE),
        ('BACKGROUND', (0,1), (-1,-1), CARD),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor("#21262d")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t3)
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph('<font color="#8b949e">Tier C ensures publishers never earn less than standard ads — zero financial risk.</font>', small_style))

    # === SLIDE 6: What's Next ===
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("What's Next", heading_style))
    story.append(Paragraph("This is a working prototype. Here's what we need to go further:", body_style))
    story.append(Spacer(1, 0.3*cm))
    
    nexts = [
        ("Unity SDK", "Native integration for game developers. The web prototype proves the concept."),
        ("Real Game Partner", "One game to run a live pilot. Even a small indie game validates the model."),
        ("First Advertiser", "One brand to buy verified attention. Even a small campaign proves unit economics."),
        ("Larger Sample", "Scale from 93 to 1000+ users for statistical significance."),
    ]
    for title, desc in nexts:
        story.append(Paragraph(f'<font color="#58a6ff"><b>{title}</b></font> — <font color="#8b949e">{desc}</font>', body_style))

    # === SLIDE 7: Contact ===
    story.append(Spacer(1, 2*cm))
    story.append(Paragraph("Let's Talk", heading_style))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph('<font size="14" color="#e6edf3">Amir Hossein Arman Nia</font>', ParagraphStyle('name', alignment=TA_CENTER, spaceAfter=8)))
    story.append(Paragraph('<font size="11" color="#8b949e">Product Architect</font>', ParagraphStyle('role', alignment=TA_CENTER, spaceAfter=16)))
    story.append(Paragraph('<font size="11" color="#58a6ff">adquest.tech</font>', ParagraphStyle('web', alignment=TA_CENTER, spaceAfter=8)))
    story.append(Paragraph('<font size="10" color="#8b949e">Looking for: Game developers, advertisers, collaborators</font>', ParagraphStyle('look', alignment=TA_CENTER)))

    doc.build(story)
    print(f"PDF created: {OUTPUT}")

build()
