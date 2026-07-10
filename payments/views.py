import razorpay 
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking
from .models import Payment

# Initialize the Razorpay Client using your Test Credentials[cite: 2]
razorpay_client = razorpay.Client(auth=("rzp_test_TBraG2wTJEkMOR", "4Cqw27JMAhGEDIcgWPBg4Xea"))

class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        booking = get_object_or_404(Booking, id=booking_id, student=request.user)

        # Look for existing initiated payments, or generate a fresh checkout order[cite: 2]
        try:
            payment = Payment.objects.get(booking=booking, status='INITIATED')
            order_id = payment.razorpay_order_id
        except Payment.DoesNotExist:
            # Razorpay requires price inputs to be absolute integers in minor currency units (Paise)[cite: 2]
            razorpay_amount = int(float(booking.total_amount) * 100)
            
            # Create the structural order parameter dictionary payload[cite: 2]
            data = {
                "amount": razorpay_amount,
                "currency": "INR",
                "receipt": f"receipt_order_{booking.id}",
                "payment_capture": 1 # Auto-capture payments immediately on clearance[cite: 2]
            }
            
            # Hit the official Razorpay REST Endpoint server-side[cite: 2]
            razorpay_order = razorpay_client.order.create(data=data)
            order_id = razorpay_order['id']
            
            # Store the tracking identifier safely inside our database ledger[cite: 2]
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

        # Structure payload to validate the cryptographic signature returned from the frontend[cite: 2]
        params_dict = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        }

        try:
            # Verifies that the payment signature wasn't tampered with mid-flight[cite: 2]
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

                # Automated Email Notification Trigger[cite: 2]
                try:
                    subject = f"Booking Confirmed: {booking.event.title}!"
                    message = (
                        f"Hello {booking.student.username},\n\n"
                        f"Your registration payment was processed successfully!\n"
                        f"Event: {booking.event.title}\n"
                        f"Pass Volume Allocated: {booking.quantity} Seat(s)\n"
                        f"Transaction Reference ID: {payment_id}\n\n"
                        f"Please visit your Student Dashboard profile to download your digital PDF ticket pass.\n\n"
                        f"- EventSpark Management Desk"
                    )
                    send_mail(subject, message, settings.EMAIL_HOST_USER, [booking.student.email], fail_silently=False)
                except Exception as email_err:
                    print("SMTP Server Timeout Warning:", email_err)

                return Response({"message": "Transaction verified and ticket issued successfully!"}, status=status.HTTP_200_OK)
            
            else:
                payment.status = 'FAILED'
                payment.save()
                
                booking.status = 'CANCELLED'
                
                # Safe decrement safeguard check to prevent crashing if tickets_sold calculation errors out
                if booking.event.tickets_sold and booking.event.tickets_sold >= booking.quantity:
                    booking.event.tickets_sold -= booking.quantity
                    booking.event.save()
                    
                booking.save()
                return Response({"error": "Payment validation failed or signature invalid."}, status=status.HTTP_400_BAD_REQUEST)