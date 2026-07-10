# bookings/utils.py
import io
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_qr_code_image(data_string):
    """Generates a QR code in-memory as a bytes stream."""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data_string)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    return img_byte_arr

def generate_ticket_pdf(booking):
    """Generates an interview-ready, structured PDF ticket using ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    
    # Setup styling palettes
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TicketTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1E3A8A'), # Dark Blue
        spaceAfter=15
    )
    body_style = ParagraphStyle(
        'TicketBody',
        parent=styles['Normal'],
        fontSize=12,
        leading=16,
        spaceAfter=8
    )

    # 1. Header Information
    story.append(Paragraph(f"E-TICKET: {booking.event.title}", title_style))
    story.append(Spacer(1, 10))
    
    # 2. Event Metadata
    story.append(Paragraph(f"<b>Date & Time:</b> {booking.event.date.strftime('%B %d, %Y at %I:%M %p')}", body_style))
    story.append(Paragraph(f"<b>Venue Location:</b> {booking.event.location}", body_style))
    story.append(Paragraph(f"<b>Attendee Name:</b> {booking.student.username} ({booking.student.email})", body_style))
    story.append(Paragraph(f"<b>Ticket Quantity:</b> {booking.quantity} Seat(s)", body_style))
    story.append(Paragraph(f"<b>Booking Reference Status:</b> {booking.status}", body_style))
    story.append(Spacer(1, 20))
    
    # 3. Embed Dynamic QR Code into Document Layout
    # The payload is the unique cryptographic string we stored safely in Phase 3
    qr_stream = generate_qr_code_image(booking.qr_code_key)
    story.append(RLImage(qr_stream, width=150, height=150))
    
    story.append(Spacer(1, 15))
    story.append(Paragraph("<font color='gray'>Please present this QR code at the registration desk for verification.</font>", body_style))

    # Compile the final document array
    doc.build(story)
    buffer.seek(0)
    return buffer