# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentProfile, OrganizerProfile

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    # Profile specific fields passed in the flat registration request
    is_student = serializers.BooleanField(required=True)
    is_organizer = serializers.BooleanField(required=True)
    
    # Student specific optional fields
    roll_number = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    
    # Organizer specific optional fields
    organization_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'phone_number', 'is_student', 
                  'is_organizer', 'roll_number', 'department', 'organization_name']

    def validate(self, attrs):
        if attrs.get('is_student') and attrs.get('is_organizer'):
            raise serializers.ValidationError("A user cannot be both a student and an organizer.")
        if not attrs.get('is_student') and not attrs.get('is_organizer'):
            raise serializers.ValidationError("User must select either a student or organizer role.")
        return attrs

    def create(self, validated_data):
        is_student = validated_data.pop('is_student')
        is_organizer = validated_data.pop('is_organizer')
        
        roll_number = validated_data.pop('roll_number', None)
        department = validated_data.pop('department', None)
        organization_name = validated_data.pop('organization_name', None)

        # Create user instance securely
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            phone_number=validated_data.get('phone_number', ''),
            is_student=is_student,
            is_organizer=is_organizer
        )

        # Build dynamic profile mapping based on selected role
        if is_student:
            StudentProfile.objects.create(
                user=user, 
                roll_number=roll_number or "PENDING", 
                department=department or "General"
            )
        elif is_organizer:
            OrganizerProfile.objects.create(
                user=user, 
                organization_name=organization_name or f"{user.username} Org"
            )

        return user