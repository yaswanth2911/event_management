# payments/urls.py
from django.urls import path
from .views import CreateOrderView, VerifyPaymentView

urlpatterns = [
    path('payments/create/', CreateOrderView.as_view(), name='payment-create'),
    path('payments/verify/', VerifyPaymentView.as_view(), name='payment-verify'),
]