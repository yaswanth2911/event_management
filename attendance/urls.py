# attendance/urls.py
from django.urls import path
from .views import ScanTicketVerificationView

urlpatterns = [
    path('scan-ticket/', ScanTicketVerificationView.as_view(), name='scan-ticket-verify'),
]