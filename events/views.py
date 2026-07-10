from django.contrib.auth import get_user_model
from django.db.models import Sum

from rest_framework import generics, filters, permissions, status
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from django_filters.rest_framework import DjangoFilterBackend

from bookings.models import Booking
from .models import Event, Category
from .permissions import IsOrganizerOrReadOnly
from .serializers import EventSerializer, CategorySerializer

User = get_user_model()


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsOrganizerOrReadOnly]


class EventListCreateView(generics.ListCreateAPIView):
    queryset = Event.objects.all().order_by("-created_at")
    serializer_class = EventSerializer
    permission_classes = [IsOrganizerOrReadOnly]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = ["category", "location"]
    search_fields = ["title", "description", "location"]
    ordering_fields = ["date", "price"]

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)


class EventDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_organizer:
            return Event.objects.filter(organizer=user)

        return Event.objects.all()


class AdminAnalyticsView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
        permissions.IsAdminUser,
    ]

    def get(self, request):
        total_revenue = (
            Booking.objects.filter(status="CONFIRMED")
            .aggregate(total=Sum("total_amount"))["total"]
            or 0
        )

        total_tickets_sold = (
            Booking.objects.filter(status="CONFIRMED")
            .aggregate(total=Sum("quantity"))["total"]
            or 0
        )

        total_students = User.objects.filter(is_student=True).count()
        total_organizers = User.objects.filter(is_organizer=True).count()

        recent_bookings = (
            Booking.objects.select_related("student", "event")
            .order_by("-created_at")[:5]
        )

        bookings_data = [
            {
                "id": booking.id,
                "student": booking.student.username,
                "event": booking.event.title,
                "amount": float(booking.total_amount),
                "status": booking.status,
            }
            for booking in recent_bookings
        ]

        return Response(
            {
                "metrics": {
                    "total_revenue": float(total_revenue),
                    "total_tickets_sold": total_tickets_sold,
                    "total_students": total_students,
                    "total_organizers": total_organizers,
                    "total_events": Event.objects.count(),
                },
                "recent_bookings": bookings_data,
            },
            status=status.HTTP_200_OK,
        )