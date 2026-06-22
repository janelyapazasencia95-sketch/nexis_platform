from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
)


def generar_pdf_tabla(response, titulo, subtitulo, encabezados, filas):
    doc = SimpleDocTemplate(
        response,
        pagesize=landscape(A4),
        rightMargin=1.2 * cm,
        leftMargin=1.2 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
    )

    styles = getSampleStyleSheet()

    titulo_style = ParagraphStyle(
        "TituloNexis",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=colors.HexColor("#07226B"),
        alignment=1,
        spaceAfter=6,
    )

    subtitulo_style = ParagraphStyle(
        "SubtituloNexis",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=colors.HexColor("#454651"),
        alignment=1,
        spaceAfter=14,
    )

    texto_style = ParagraphStyle(
        "TextoTabla",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
    )

    elementos = []

    elementos.append(Paragraph("NEXIS", titulo_style))
    elementos.append(Paragraph(titulo, titulo_style))
    elementos.append(Paragraph(subtitulo, subtitulo_style))

    fecha_actual = datetime.now().strftime("%d/%m/%Y %H:%M")
    elementos.append(
        Paragraph(
            f"Reporte generado automáticamente el {fecha_actual}",
            subtitulo_style,
        )
    )

    elementos.append(Spacer(1, 0.3 * cm))

    data = []
    data.append([Paragraph(str(h), texto_style) for h in encabezados])

    for fila in filas:
        data.append([Paragraph(str(celda), texto_style) for celda in fila])

    tabla = Table(data, repeatRows=1)

    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#07226B")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 8),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D3E4FE")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [
                    colors.white,
                    colors.HexColor("#F8F9FF"),
                ]),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    elementos.append(tabla)

    elementos.append(Spacer(1, 0.5 * cm))
    elementos.append(
        Paragraph(
            "Documento generado por la plataforma NEXIS para gestión de fibra de vicuña.",
            subtitulo_style,
        )
    )

    doc.build(elementos)

    return response