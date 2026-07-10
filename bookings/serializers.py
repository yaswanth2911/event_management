# bookings/serializers.py
from rest_framework import serializers
from django.db import transaction
from .models import Booking
from events.models import Event
import uuid

class BookingSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_date = serializers.DateTimeField(source='event.date', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'event', 'event_title', 'event_date', 'quantity', 'total_amount', 'status', 'created_at']
        read_only_fields = ['total_amount', 'status', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        event = validated_data['event']
        quantity = validated_data['quantity']

        # Interview Highlight: Atomic block with Row-Level Locking
        with transaction.atomic():
            # Lock the event row until transaction completes
            locked_event = Event.objects.select_for_update().get(pk=event.pk)
            
            if locked_event.seats_available < quantity:
                raise serializers.ValidationError("Requested ticket count exceeds remaining capacity.")

            # Calculate financial parameters safely on backend
            total_price = locked_event.price * quantity
            
            # Temporarily reserve seats (will be rolled back automatically if payment fails/expires)
            locked_event.tickets_sold += quantity
            locked_event.save()

            # Generate unique identifier for QR processing later
            unique_key = str(uuid.uuid4())

            booking = Booking.objects.create(
                student=user,
                event=locked_event,
                quantity=quantity,
                total_amount=total_price,
                status='PENDING',
                qr_code_key=unique_key
            )
            return booking