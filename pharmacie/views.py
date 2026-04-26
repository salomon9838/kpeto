# pharmacie/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Conversation, PharmacieMessage
from .serializers import ConversationSerializer, MessageSerializer, MessageSendSerializer

class IsPharmacie(permissions.BasePermission):
    """Permission : seul un pharmacien ou admin peut accéder"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'pharmacie', 'doctor']

class ConversationViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des conversations pharmacie"""
    serializer_class = ConversationSerializer
    permission_classes = [IsPharmacie]
    
    def get_queryset(self):
        """Retourne uniquement les conversations du pharmacien connecté"""
        return Conversation.objects.filter(
            pharmacy=self.request.user
        ).select_related('patient', 'consultation').order_by('-updated_at')
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Récupérer tous les messages d'une conversation"""
        conversation = self.get_object()
        messages = conversation.messages.select_related('sender', 'patient').order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Envoyer un nouveau message dans une conversation"""
        conversation = self.get_object()
        serializer = MessageSendSerializer(data=request.data)
        
        if serializer.is_valid():
            message = PharmacieMessage.objects.create(
                conversation=conversation,
                sender=request.user,
                sender_role='pharmacist',
                content=serializer.validated_data['content'],
                consultation_id=serializer.validated_data.get('consultation_id'),
                patient_id=serializer.validated_data.get('patient_id'),
            )
            
            # Mettre à jour la conversation
            conversation.last_message = message.content
            conversation.last_message_time = timezone.now()
            conversation.save(update_fields=['last_message', 'last_message_time', 'updated_at'])
            
            return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        """Marquer tous les messages non lus comme lus"""
        conversation = self.get_object()
        conversation.messages.filter(is_read=False).update(is_read=True)
        return Response({'status': 'marked_as_read', 'conversation_id': conversation.id})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Compter les messages non lus pour ce pharmacien"""
        count = PharmacieMessage.objects.filter(
            conversation__pharmacy=request.user,
            is_read=False,
            sender_role='customer'
        ).count()
        return Response({'unread_count': count})
    

    # pharmacie/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count, Q , F
from django.utils import timezone
from datetime import timedelta
from doctor.models import Consultation, Patient
from .models import Medicine, Order, OrderItem, ChatMessage

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Statistiques du dashboard pharmacie"""
    today = timezone.now().date()
    
    # Commandes du jour
    today_orders = Order.objects.filter(
        created_at__date=today,
        pharmacy__user=request.user
    ).count()
    
    # Revenus du jour
    today_revenue = Order.objects.filter(
        created_at__date=today,
        pharmacy__user=request.user,
        status='completed'
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    # Alertes stock
    low_stock = Medicine.objects.filter(
        pharmacy__user=request.user,
        stock_quantity__lte=F('min_stock')
    ).count()
    
    # Messages non lus
    active_chats = ChatMessage.objects.filter(
        conversation__pharmacy__user=request.user,
        is_read=False,
        sender_role='customer'
    ).count()
    
    # Commandes en attente
    pending = Order.objects.filter(
        pharmacy__user=request.user,
        status__in=['pending', 'processing']
    ).count()
    
    # Patients totaux liés aux consultations
    total_patients = Patient.objects.filter(
        consultation__service__in=['cardiologie', 'ophtalmo', 'chirurgie', 'urologie', 'general']
    ).distinct().count()
    
    return Response({
        'todayOrders': today_orders,
        'todayRevenue': today_revenue,
        'lowStockCount': low_stock,
        'activeChats': active_chats,
        'pendingOrders': pending,
        'totalPatients': total_patients,
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def medicines_list(request):
    """Liste des médicaments avec filtres"""
    alerte = request.query_params.get('alerte_stock') == 'true'
    
    queryset = Medicine.objects.filter(pharmacy__user=request.user)
    
    if alerte:
        queryset = queryset.filter(Q(stock_quantity__lte=F('min_stock')) | Q(status='out_of_stock'))
    
    medicines = queryset.select_related('category').order_by('-last_updated')
    
    data = []
    for med in medicines:
        data.append({
            'id': med.id,
            'name': med.name,
            'code': med.code,
            'stockQuantity': med.stock_quantity,
            'minStock': med.min_stock,
            'price': med.selling_price,
            'category': med.category.name if med.category else 'Non catégorisé',
            'status': med.status,
            'lastUpdated': med.last_updated.isoformat(),
        })
    
    return Response(data)

@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_medicine_stock(request, pk):
    """Mettre à jour le stock d'un médicament"""
    try:
        medicine = Medicine.objects.get(id=pk, pharmacy__user=request.user)
        new_qty = request.data.get('stock_quantity')
        
        if new_qty is not None:
            medicine.stock_quantity = new_qty
            medicine.status = 'out_of_stock' if new_qty == 0 else ('low_stock' if new_qty <= medicine.min_stock else 'in_stock')
            medicine.last_updated = timezone.now()
            medicine.save()
            
            return Response({
                'id': medicine.id,
                'stockQuantity': medicine.stock_quantity,
                'status': medicine.status,
            })
        
        return Response({'error': 'stock_quantity requis'}, status=status.HTTP_400_BAD_REQUEST)
        
    except Medicine.DoesNotExist:
        return Response({'error': 'Médicament non trouvé'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def orders_list(request):
    """Liste des commandes récentes"""
    limit = int(request.query_params.get('limit', 10))
    
    orders = Order.objects.filter(
        pharmacy__user=request.user
    ).select_related('patient', 'consultation').order_by('-created_at')[:limit]
    
    data = []
    for order in orders:
        data.append({
            'id': order.id,
            'orderNumber': order.order_number,
            'patientName': f"{order.patient.nom} {order.patient.prenoms}" if order.patient else 'Patient inconnu',
            'consultationId': order.consultation.id if order.consultation else None,
            'patientId': order.patient.id if order.patient else None,
            'items': [{'medicine': item.medicine.name, 'quantity': item.quantity, 'price': item.price} for item in order.items.all()],
            'total': order.total_amount,
            'status': order.status,
            'orderType': order.order_type,
            'createdAt': order.created_at.isoformat(),
        })
    
    return Response(data)

@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_order_status(request, pk):
    """Mettre à jour le statut d'une commande"""
    try:
        order = Order.objects.get(id=pk, pharmacy__user=request.user)
        new_status = request.data.get('status')
        
        if new_status in ['pending', 'processing', 'completed', 'cancelled']:
            order.status = new_status
            order.save()
            return Response({'status': new_status, 'orderId': order.id})
        
        return Response({'error': 'Statut invalide'}, status=status.HTTP_400_BAD_REQUEST)
        
    except Order.DoesNotExist:
        return Response({'error': 'Commande non trouvée'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sales_data(request):
    """Données de ventes pour le graphique"""
    period = request.query_params.get('period', 'week')  # day, week, month
    
    if period == 'week':
        days = 7
    elif period == 'month':
        days = 30
    else:
        days = 1
    
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)
    
    from django.db.models.functions import TruncDate
    
    data = Order.objects.filter(
        pharmacy__user=request.user,
        status='completed',
        created_at__date__range=[start_date, end_date]
    ).annotate(date=TruncDate('created_at')).values('date').annotate(
        revenue=Sum('total_amount'),
        orders=Count('id')
    ).order_by('date')
    
    # Formatage pour le frontend
    result = []
    for item in data:
        result.append({
            'date': item['date'].strftime('%a'),  # Lun, Mar, etc.
            'revenue': item['revenue'] or 0,
            'orders': item['orders'] or 0,
        })
    
    return Response(result)