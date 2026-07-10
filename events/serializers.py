# events/serializers.py
from rest_framework import serializers
from .models import Event, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    seats_available = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'organizer', 'organizer_name', 'category', 'category_name',
            'title', 'description', 'date', 'location', 'price', 
            'capacity', 'tickets_sold', 'seats_available', 'banner', 'created_at'
        ]
        read_only_fields = ['organizer', 'tickets_sold']