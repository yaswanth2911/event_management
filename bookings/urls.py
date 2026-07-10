
from django.urls import path
from .views import BookingCreateListView, DownloadTicketPDFView

urlpatterns = [
    path('bookings/', BookingCreateListView.as_view(), name='booking-list-create'),
    path('bookings/<int:booking_id>/download/', DownloadTicketPDFView.as_view(), name='booking-download-pdf'),
]