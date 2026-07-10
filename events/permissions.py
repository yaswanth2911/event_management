# events/permissions.py
from rest_framework import permissions

class IsOrganizerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow organizers of an event to edit or delete it.
    """
    def has_permission(self, request, view):
        # Allow any safe read-only operations (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
        # Check if the user is authenticated and explicitly registered as an organizer
        return request.user.is_authenticated and request.user.is_organizer

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions are only allowed to the organizer who created the event
        return obj.organizer == request.user