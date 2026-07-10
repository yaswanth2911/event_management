# bookings/views.py
from rest_framework import generics, permissions
from .models import Booking
from .serializers import BookingSerializer
from django.http import HttpResponse
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .utils import generate_ticket_pdf
class BookingCreateListView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Students only see their historical orders, organizers see all metrics for their events
        if self.request.user.is_organizer:
            return Booking.objects.filter(event__organizer=self.request.user)
        return Booking.objects.filter(student=self.request.user)
    

class DownloadTicketPDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        # Enforce multi-tenant privacy: Students can fetch their own tickets, organizers can access their client tickets
        if request.user.is_organizer:
            booking = get_object_or_404(Booking, id=booking_id, event__organizer=request.user, status='CONFIRMED')
        else:
            booking = get_object_or_404(Booking, id=booking_id, student=request.user, status='CONFIRMED')
        
        # Fire up the rendering generator engine
        pdf_buffer = generate_ticket_pdf(booking)
        
        # Structure standard HTTP attachment protocols
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="ticket_{booking.id}.pdf"'
        return response