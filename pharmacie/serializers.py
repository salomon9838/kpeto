# pharmacie/serializers.py
from rest_framework import serializers
from .models import Conversation, PharmacieMessage

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    patient_name = serializers.CharField(source='patient.nom', read_only=True) if hasattr(serializers, 'CharField') else serializers.SerializerMethodField()
    
    def get_patient_name(self, obj):
        return obj.patient.nom if obj.patient and hasattr(obj.patient, 'nom') else 'Patient'
    
    class Meta:
        model = PharmacieMessage
        fields = [
            'id', 'conversation', 'sender', 'sender_name', 'sender_role',
            'content', 'consultation', 'patient', 'patient_name',
            'is_read', 'created_at'
        ]
        read_only_fields = ['sender', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.nom', read_only=True)
    patient_phone = serializers.CharField(source='patient.telephone', read_only=True)
    last_message = serializers.CharField(read_only=True)
    unread_count = serializers.SerializerMethodField()
    
    def get_unread_count(self, obj):
        return obj.messages.filter(is_read=False, sender_role='customer').count()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'patient', 'patient_name', 'patient_phone',
            'consultation', 'last_message', 'last_message_time',
            'unread_count', 'created_at', 'updated_at'
        ]


class MessageSendSerializer(serializers.ModelSerializer):
    consultation_id = serializers.IntegerField(write_only=True, required=False)
    patient_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = PharmacieMessage
        fields = ['content', 'consultation_id', 'patient_id']
    
    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Le message ne peut pas être vide")
        if len(value) > 2000:
            raise serializers.ValidationError("Message trop long (max 2000 caractères)")
        return value.strip()