from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking
from .models import Payment


class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")

        booking = get_object_or_404(
            Booking,
            id=booking_id,
            student=request.user,
        )

        mock_order_id = (
            f"order_rzp_{booking.id}_{booking.qr_code_key[:6]}"
        )

        payment, created = Payment.objects.get_or_create(
            booking=booking,
            defaults={
                "razorpay_order_id": mock_order_id,
                "amount": booking.total_amount,
                "status": "INITIATED",
            },
        )

        return Response(
            {
                "order_id": payment.razorpay_order_id,
                "amount": float(payment.amount),
                "currency": "INR",
                "booking_id": booking.id,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("razorpay_order_id")
        payment_id = request.data.get("razorpay_payment_id")
        signature = request.data.get("razorpay_signature")
        payment_success = (
            request.data.get("status") == "SUCCESS"
        )

        payment = get_object_or_404(
            Payment,
            razorpay_order_id=order_id,
        )

        booking = payment.booking

        with transaction.atomic():

            if payment_success:

                payment.status = "SUCCESS"
                payment.razorpay_payment_id = payment_id
                payment.razorpay_signature = signature
                payment.save()

                booking.status = "CONFIRMED"
                booking.save()

                # Send confirmation email
                try:
                    subject = f"Booking Confirmed: {booking.event.title}"

                    message = f"""
Hello {booking.student.username},

Your booking has been confirmed.

Event: {booking.event.title}
Tickets: {booking.quantity}
Transaction ID: {payment_id}

You can now download your PDF ticket from your dashboard.

Thank you!
"""

                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=settings.EMAIL_HOST_USER,
                        recipient_list=[booking.student.email],
                        fail_silently=False,
                    )

                except Exception as e:
                    print("Email Error:", e)

                return Response(
                    {
                        "message": "Payment verified successfully."
                    },
                    status=status.HTTP_200_OK,
                )

            payment.status = "FAILED"
            payment.save()

            booking.status = "CANCELLED"

            booking.event.tickets_sold -= booking.quantity
            booking.event.save()

            booking.save()

            return Response(
                {
                    "error": "Payment failed."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
# payments/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from bookings.models import Booking
from .models import Payment
import razorpay

# Initialize the authentic Razorpay Client wrapper using your Test Credentials
razorpay_client = razorpay.Client(auth=("rzp_test_TBraG2wTJEkMOR", "4Cqw27JMAhGEDIcgWPBg4Xea"))

class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        booking = get_object_or_404(Booking, id=booking_id, student=request.user)

        # Look for existing initiated payments, or generate a fresh checkout order
        try:
            payment = Payment.objects.get(booking=booking, status='INITIATED')
            order_id = payment.razorpay_order_id
        except Payment.DoesNotExist:
            # Razorpay requires price inputs to be absolute integers in minor currency units (Paise)
            # e.g., ₹123.00 becomes 12300 Paise
            razorpay_amount = int(float(booking.total_amount) * 100)
            
            # Create the structural order parameter dictionary payload
            data = {
                "amount": razorpay_amount,
                "currency": "INR",
                "receipt": f"receipt_order_{booking.id}",
                "payment_capture": 1 # Auto-capture payments immediately on clearance
            }
            
            # Hit the official Razorpay REST Endpoint server-side
            razorpay_order = razorpay_client.order.create(data=data)
            order_id = razorpay_order['id']
            
            # Store the tracking identifier safely inside our MySQL ledger
            payment = Payment.objects.create(
                booking=booking,
                razorpay_order_id=order_id,
                amount=booking.total_amount,
                status='INITIATED'
            )

        return Response({
            "order_id": order_id,
            "amount": float(payment.amount),
            "currency": "INR",
            "booking_id": booking.id
        }, status=status.HTTP_201_CREATED)

class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('razorpay_order_id')
        payment_id = request.data.get('razorpay_payment_id')
        signature = request.data.get('razorpay_signature')

        payment = get_object_or_404(Payment, razorpay_order_id=order_id)
        booking = payment.booking

        # Interview Security Guardrail: Validate the cryptographic signature signature returned from frontend
        params_dict = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        }

        try:
            # Verifies that the payment signature wasn't tampered with mid-flight
            razorpay_client.utility.verify_payment_signature(params_dict)
            payment_success = True
        except Exception:
            payment_success = False

        with transaction.atomic():
            if payment_success:
                payment.status = 'SUCCESS'
                payment.razorpay_payment_id = payment_id
                payment.razorpay_signature = signature
                payment.save()

                booking.status = 'CONFIRMED'
                booking.save()

                # Automated Email Notification Trigger
                try:
                    subject = f"Booking Confirmed: {booking.event.title}!"
                    message = (
                        f"Hello {booking.student.username},\n\n"
                        f"Your registration payment was processed successfully!\n"
                        f"Event: {booking.event.title}\n"
                        f"Pass Volume Allocated: {booking.quantity} Seat(s)\n"
                        f"Transaction Reference ID: {payment_id}\n\n"
                        f"Please visit your Student Dashboard profile to download your digital PDF ticket pass.\n\n"
                        f"- Eventify Management Desk"
                    )
                    send_mail(subject, message, settings.EMAIL_HOST_USER, [booking.student.email], fail_silently=False)
                except Exception as email_err:
                    print("SMTP Server Timeout Warning:", email_err)

                return Response({"message": "Transaction verified and ticket issued successfully!"}, status=status.HTTP_200_OK)
            else:
                payment.status = 'FAILED'
                payment.save()
                booking.status = 'CANCELLED'
                booking.event.tickets_sold -= booking.quantity
                booking.event.save()
                booking.save()
                return Response({"error": "Payment validation failed or signature invalid."}, status=status.HTTP_400_BAD_REQUEST)