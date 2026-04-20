# doctor/views.py
import logging
from datetime import datetime, timedelta

from django.db import IntegrityError, transaction
from django.db.models import Count, Q, F, Sum, Avg
from django.utils import timezone
from django.contrib.auth import authenticate, get_user_model
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token

from .models import *
from .serializers import *

logger = logging.getLogger(__name__)
User = get_user_model()

# =============================================================================
# 📊 STATISTIQUES — ENDPOINT /api/stats/
# =============================================================================

from rest_framework.permissions import IsAuthenticated


logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_view(request):
    """
    Endpoint: GET /api/stats/?period=day|month|year|all
    Retourne les statistiques médicales agrégées depuis la base de données
    """
    period = request.query_params.get('period', 'all')
    
    logger.info(f"📊 Stats request - Period: {period}, User: {request.user}")
    
    # 🔍 Filtre de date selon la période
    date_filter = {}
    now = timezone.now()
    
    if period == 'day':
        date_filter['date_consultation__date'] = now.date()
    elif period == 'month':
        date_filter['date_consultation__gte'] = now - timedelta(days=30)
    elif period == 'year':
        date_filter['date_consultation__gte'] = now - timedelta(days=365)
    
    
    # 📊 Statistiques globales
    try:
        # Patients créés dans la période
        patient_filter = {}
        if period != 'all':
            if 'date_consultation__gte' in date_filter:
                patient_filter['created_at__gte'] = date_filter['date_consultation__gte']
            if 'date_consultation__date' in date_filter:
                patient_filter['created_at__date'] = date_filter['date_consultation__date']
        
        total_patients = Patient.objects.filter(**patient_filter).count()
        logger.info(f"✅ Total patients: {total_patients} (filter: {patient_filter})")
        
        # Consultations dans la période
        consultations_qs = Consultation.objects.filter(**date_filter) if date_filter else Consultation.objects.all()
        total_consultations = consultations_qs.count()
        logger.info(f"✅ Total consultations: {total_consultations} (filter: {date_filter})")
        
        # Urgences (recherche dans le motif ou un champ dedicated)
        consultations_urgences = consultations_qs.filter(
            Q(motif_consultation__icontains='urgence') | 
            Q(motif_consultation__icontains='urgent') |
            Q(service='urgence') if hasattr(Consultation, 'service') else Q()
        ).count()
        logger.info(f"✅ Urgences: {consultations_urgences}")
        
        # Maladies distinctes (via le champ 'service')
        maladies_distinctes = consultations_qs.values('service').distinct().count()
        logger.info(f"✅ Maladies distinctes: {maladies_distinctes}")
        
        # 👨‍⚕️ Performance par médecin
        par_doctor = consultations_qs.values(
            'doctor__id',
            'doctor__username',
            'doctor__first_name',
            'doctor__last_name'
        ).annotate(
            patients=Count('patient', distinct=True),
            consultations=Count('id', distinct=True)
        ).order_by('-consultations')
        
        # Formatage pour le frontend
        par_doctor_formatted = []
        for item in par_doctor:
            doctor_name = f"{item['doctor__first_name'] or ''} {item['doctor__last_name'] or item['doctor__username']}".strip()
            if not doctor_name:
                doctor_name = f"Dr. {item['doctor__username']}"
            
            par_doctor_formatted.append({
                'medecin__username': doctor_name,
                'patients': item['patients'],
                'consultations': item['consultations']
            })
        
        logger.info(f"✅ Par médecin: {len(par_doctor_formatted)} médecins")
        
        # 🏥 Répartition par service
        par_service = consultations_qs.values('service').annotate(
            patients=Count('patient', distinct=True),
            consultations=Count('id', distinct=True)
        ).order_by('-consultations')
        
        par_service_formatted = [
            {
                'service': item['service'] or 'Non spécifié',
                'patients': item['patients'],
                'consultations': item['consultations']
            }
            for item in par_service
        ]
        
        logger.info(f"✅ Par service: {len(par_service_formatted)} services")
        
        # ✅ Réponse JSON structurée
        response_data = {
            'total_patients': total_patients,
            'total_consultations': total_consultations,
            'consultations_urgences': consultations_urgences,
            'maladies_distinctes': maladies_distinctes,
            'par_doctor': par_doctor_formatted,
            'par_service': par_service_formatted,
            'period': period,
            'generated_at': now.isoformat(),
            'debug': {
                'patient_filter': patient_filter,
                'consultation_filter': date_filter,
            }
        }
        
        logger.info(f"📤 Response: {response_data}")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"❌ Error in stats_view: {str(e)}", exc_info=True)
        return Response({
            'error': 'Erreur lors du calcul des statistiques',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# =============================================================================
# PERMISSIONS PERSONNALISÉES
# =============================================================================
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'doctor'

class IsPatient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'patient'

class IsAdminOrDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'doctor']

# =============================================================================
# 🔐 AUTHENTIFICATION & GESTION UTILISATEURS
# =============================================================================
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Identifiants requis'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Identifiants incorrects'}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.is_active:
        return Response({'error': 'Compte désactivé'}, status=status.HTTP_403_FORBIDDEN)
    if user.role != 'admin' and not user.is_verified:
        return Response({'error': 'Compte en attente de vérification'}, status=status.HTTP_403_FORBIDDEN)
    
    token, _ = Token.objects.get_or_create(user=user)
    user_data = UserSerializer(user).data
    if user.role == 'doctor' and hasattr(user, 'doctor_profile'):
        user_data['specialty'] = user.doctor_profile.specialty
        user_data['matricule'] = user.doctor_profile.matricule
        
    return Response({
        'token': token.key,
        'user': user_data,
        'role': user.role,
        'message': f'Bienvenue {user.first_name or user.username}'
    })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_patient_view(request):
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            with transaction.atomic():
                user = serializer.save(role='patient', is_verified=True)
                token, _ = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'user': UserSerializer(user).data,
                    'role': 'patient'
                }, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response({'error': 'Nom d\'utilisateur ou email déjà utilisé'}, status=status.HTTP_409_CONFLICT)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAdmin])
def register_doctor_view(request):
    serializer = DoctorCreateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            with transaction.atomic():
                user = serializer.save()
                token, _ = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'user': UserSerializer(user).data,
                    'doctor_profile': DoctorProfileSerializer(user.doctor_profile).data,
                    'role': 'doctor'
                }, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response({'error': 'Matricule, username ou email déjà utilisé'}, status=status.HTTP_409_CONFLICT)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        request.user.auth_token.delete()
    except:
        pass
    return Response({'message': 'Déconnexion réussie'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    data = UserSerializer(request.user).data
    if request.user.role == 'doctor' and hasattr(request.user, 'doctor_profile'):
        data['doctor_profile'] = DoctorProfileSerializer(request.user.doctor_profile).data
    return Response(data)

# =============================================================================
# 👨‍ ADMINISTRATION
# =============================================================================
class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    ordering_fields = ['date_joined', 'last_name', 'role']
    
    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        return qs.filter(role=role) if role else qs
    
    @action(detail=True, methods=['patch'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response({'status': f'Utilisateur {"activé" if user.is_active else "désactivé"}'})
    
    @action(detail=True, methods=['patch'])
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        if new_role in dict(User.ROLE_CHOICES):
            user.role = new_role
            user.save(update_fields=['role'])
            return Response({'status': f'Rôle changé en {new_role}'})
        return Response({'error': 'Rôle invalide'}, status=status.HTTP_400_BAD_REQUEST)


class AdminDoctorViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les médecins"""
    serializer_class = DoctorProfileSerializer 
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'doctor_profile__matricule', 'first_name', 'last_name']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DoctorCreateSerializer
        return DoctorProfileSerializer

    def list(self, request):
        doctors_qs = User.objects.filter(role='doctor').select_related('doctor_profile')
        data = []
        
        for user in doctors_qs:
            profile = getattr(user, 'doctor_profile', None)
            
            item = {
                'id': user.id,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip(),
                'email': user.email,
                'matricule': profile.matricule if profile else '',
                'specialty': profile.specialty if profile else '',
                'is_active': profile.is_active if profile else user.is_active,
                'phone': user.phone or '',
            }
            data.append(item)
            
        return Response(data)

    @action(detail=True, methods=['patch'])
    def toggle_active(self, request, pk=None):
        doctor = self.get_object()
        if hasattr(doctor, 'doctor_profile'):
            doctor.doctor_profile.is_active = not doctor.doctor_profile.is_active
            doctor.doctor_profile.save(update_fields=['is_active'])
        return Response({'status': 'Statut mis à jour'})
    
    @action(detail=True, methods=['patch'])
    def change_password(self, request, pk=None):
        doctor = self.get_object()
        new_pass = request.data.get('new_password')
        if new_pass and len(new_pass) >= 8:
            doctor.set_password(new_pass)
            doctor.save(update_fields=['password'])
            return Response({'status': 'Mot de passe changé'})
        return Response({'error': 'Minimum 8 caractères requis'}, status=status.HTTP_400_BAD_REQUEST)

# =============================================================================
# 👤 PROFIL & STATISTIQUES
# =============================================================================
class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        data = UserSerializer(request.user).data
        if request.user.role == 'doctor' and hasattr(request.user, 'doctor_profile'):
            data['doctor_profile'] = DoctorProfileSerializer(request.user.doctor_profile).data
        return Response(data)
    
    def patch(self, request):
        user = request.user
        for field in ['first_name', 'last_name', 'email', 'phone']:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save(update_fields=['first_name', 'last_name', 'email', 'phone'])
        
        if user.role == 'doctor' and hasattr(user, 'doctor_profile'):
            prof = user.doctor_profile
            if 'phone' in request.data:
                prof.phone = request.data['phone']
            prof.save(update_fields=['phone'])
            return Response({
                'message': 'Profil mis à jour',
                **DoctorProfileSerializer(prof).data
            })
        return Response({
            'message': 'Profil mis à jour',
            **UserSerializer(user).data
        })

class StatsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        user = request.user
        period = request.query_params.get('period', 'all')
        date_filter = {}
        
        if period == 'today':
            date_filter['date_consultation__date'] = timezone.now().date()
        elif period == 'week':
            date_filter['date_consultation__gte'] = timezone.now() - timedelta(days=7)
        elif period == 'month':
            date_filter['date_consultation__gte'] = timezone.now() - timedelta(days=30)
        
        qs = Consultation.objects.filter(**date_filter)
        
        if user.is_doctor:
            qs = qs.filter(doctor=user)
        elif user.is_patient_user and hasattr(user, 'patient_profile'):
            qs = qs.filter(patient__user=user)
        
        return Response({
            'total_consultations': qs.count(),
            'par_service': list(qs.values('service').annotate(count=Count('id')).order_by('-count')),
            'par_doctor': list(qs.values('doctor__last_name').annotate(count=Count('id')).order_by('-count')) if user.is_admin else None,
            'low_stock': Produit.objects.filter(stock_actuel__lte=F('stock_alerte')).count() if user.is_admin else 0,
            'ventes_today': float(Vente.objects.filter(date_vente__date=timezone.now().date()).aggregate(t=Sum('montant_total'))['t'] or 0),
            'period': period,
            'role': user.role
        })

# =============================================================================
# 🏥 PATIENTS & DOSSIER MÉDICAL
# =============================================================================
class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = PageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nom', 'prenoms', 'code_patient', 'telephone']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_patient_user and hasattr(user, 'patient_profile'):
            return qs.filter(user=user)
        return qs
    
    def perform_create(self, serializer):
        if not serializer.validated_data.get('code_patient'):
            code = f"PAT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{datetime.now().microsecond % 1000:03d}"
            serializer.save(code_patient=code)
        else:
            serializer.save()
    
    @action(detail=True, methods=['get'])
    def consultations(self, request, pk=None):
        patient = self.get_object()
        consultations = Consultation.objects.filter(patient=patient).order_by('-date_consultation')
        return Response(ConsultationListSerializer(consultations, many=True).data)
    
    @action(detail=True, methods=['get'])
    def family_members(self, request, pk=None):
        patient = self.get_object()
        members = MembreFamilial.objects.filter(patient=patient)
        return Response(MembreFamilialSerializer(members, many=True).data)

class MembreFamilialViewSet(viewsets.ModelViewSet):
    queryset = MembreFamilial.objects.select_related('patient').all()
    serializer_class = MembreFamilialSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nom', 'prenom', 'lien_parente']
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_patient_user and hasattr(self.request.user, 'patient_profile'):
            return qs.filter(patient__user=self.request.user)
        return qs

class EntreeCarnetMedicalViewSet(viewsets.ModelViewSet):
    queryset = EntreeCarnetMedical.objects.select_related('membre_familial__patient').all()
    serializer_class = EntreeCarnetMedicalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_patient_user and hasattr(self.request.user, 'patient_profile'):
            return qs.filter(membre_familial__patient__user=self.request.user)
        return qs

class AntecedentViewSet(viewsets.ModelViewSet):
    queryset = Antecedent.objects.select_related('patient').all()
    serializer_class = AntecedentSerializer
    permission_classes = [permissions.IsAuthenticated]

# =============================================================================
# 🏥 CONSULTATIONS & SPÉCIALITÉS
# =============================================================================
class ConsultationViewSet(viewsets.ModelViewSet):
    serializer_class = ConsultationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient__nom', 'patient__prenoms', 'patient__code_patient', 'service', 'motif_consultation']
    ordering_fields = ['date_consultation', 'patient__nom']
    ordering = ['-date_consultation']
    
    def get_queryset(self):
        user = self.request.user
        qs = Consultation.objects.select_related('patient', 'doctor')
        if user.is_admin:
            return qs
        if user.is_doctor:
            return qs.filter(doctor=user)
        if user.is_patient_user and hasattr(user, 'patient_profile'):
            return qs.filter(patient__user=user)
        return qs.none()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConsultationDetailSerializer
        if self.action == 'create':
            return ConsultationCreateSerializer
        return ConsultationListSerializer
    
    def perform_create(self, serializer):
        user = self.request.user
        extra = {}
        if user.is_authenticated and user.is_doctor:
            extra['doctor'] = user
            extra['nom_soignant'] = f"{user.first_name} {user.last_name}".strip() or user.username
            extra['tel_soignant'] = user.phone or ''
            if hasattr(user, 'doctor_profile') and serializer.validated_data.get('service') != user.doctor_profile.specialty:
                raise serializers.ValidationError(f"Service invalide. Votre spécialité : {user.doctor_profile.get_specialty_display()}")
        serializer.save(**extra)
    
    @action(detail=True, methods=['get'])
    def ordonnance(self, request, pk=None):
        consultation = self.get_object()
        if hasattr(consultation, 'ordonnance'):
            return Response(OrdonnanceSerializer(consultation.ordonnance).data)
        return Response({'message': 'Aucune ordonnance'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def analyses(self, request, pk=None):
        consultation = self.get_object()
        return Response({
            'labo': AnalyseLaboSerializer(consultation.analyses_labo.all(), many=True).data,
            'radio': AnalyseRadioSerializer(consultation.analyses_radio.all(), many=True).data
        })

class ExamenOphtalmoViewSet(viewsets.ModelViewSet):
    queryset = ExamenOphtalmo.objects.select_related('consultation__patient').all()
    serializer_class = ExamenOphtalmoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_doctor:
            return qs.filter(consultation__doctor=self.request.user)
        return qs

class InterventionChirurgicaleViewSet(viewsets.ModelViewSet):
    queryset = InterventionChirurgicale.objects.select_related('consultation__patient').all()
    serializer_class = InterventionChirurgicaleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_doctor:
            return qs.filter(consultation__doctor=self.request.user)
        return qs

class ExamenUrologieViewSet(viewsets.ModelViewSet):
    queryset = ExamenUrologie.objects.select_related('consultation__patient').all()
    serializer_class = ExamenUrologieSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_doctor:
            return qs.filter(consultation__doctor=self.request.user)
        return qs

class ExamenCardiologieViewSet(viewsets.ModelViewSet):
    queryset = ExamenCardiologie.objects.select_related('consultation__patient').all()
    serializer_class = ExamenCardiologieSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_doctor:
            return qs.filter(consultation__doctor=self.request.user)
        return qs

# =============================================================================
# 💊 ORDONNANCES & ANALYSES
# =============================================================================
class OrdonnanceViewSet(viewsets.ModelViewSet):
    queryset = Ordonnance.objects.select_related('consultation__patient').prefetch_related('medicaments').all()
    serializer_class = OrdonnanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        return OrdonnanceCreateSerializer if self.action == 'create' else OrdonnanceSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_doctor:
            return qs.filter(consultation__doctor=self.request.user)
        if self.request.user.is_patient_user and hasattr(self.request.user, 'patient_profile'):
            return qs.filter(consultation__patient__user=self.request.user)
        return qs

class MedicamentPrescritViewSet(viewsets.ModelViewSet):
    queryset = MedicamentPrescrit.objects.select_related('ordonnance__consultation__patient').all()
    serializer_class = MedicamentPrescritSerializer
    permission_classes = [permissions.IsAuthenticated]

class AnalyseLaboViewSet(viewsets.ModelViewSet):
    queryset = AnalyseLabo.objects.select_related('consultation__patient').all()
    serializer_class = AnalyseLaboSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_doctor:
            return qs.filter(consultation__doctor=self.request.user)
        if self.request.user.is_patient_user and hasattr(self.request.user, 'patient_profile'):
            return qs.filter(consultation__patient__user=self.request.user)
        return qs

class AnalyseRadioViewSet(viewsets.ModelViewSet):
    queryset = AnalyseRadio.objects.select_related('consultation__patient').all()
    serializer_class = AnalyseRadioSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_doctor:
            return qs.filter(consultation__doctor=self.request.user)
        if self.request.user.is_patient_user and hasattr(self.request.user, 'patient_profile'):
            return qs.filter(consultation__patient__user=self.request.user)
        return qs

# =============================================================================
# 🏪 PHARMACIE & STOCK
# =============================================================================
class CategorieProduitViewSet(viewsets.ModelViewSet):
    queryset = CategorieProduit.objects.all()
    serializer_class = CategorieProduitSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nom']

class ProduitViewSet(viewsets.ModelViewSet):
    queryset = Produit.objects.select_related('categorie').all()
    serializer_class = ProduitSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code_produit', 'designation']
    ordering_fields = ['designation', 'stock_actuel', 'date_peremption']
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('alerte_stock') == 'true':
            qs = qs.filter(stock_actuel__lte=F('stock_alerte'))
        return qs
    
    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        prod = self.get_object()
        adj = int(request.data.get('adjustment', 0))
        if prod.stock_actuel + adj < 0:
            return Response({'error': 'Stock négatif interdit'}, status=status.HTTP_400_BAD_REQUEST)
        prod.stock_actuel += adj
        prod.save(update_fields=['stock_actuel'])
        return Response({'message': f'Stock ajusté: {prod.stock_actuel}'})

class ApprovisionnementViewSet(viewsets.ModelViewSet):
    queryset = Approvisionnement.objects.select_related('produit').all()
    serializer_class = ApprovisionnementSerializer
    permission_classes = [permissions.IsAuthenticated]

class VenteViewSet(viewsets.ModelViewSet):
    queryset = Vente.objects.select_related('patient').prefetch_related('lignes__produit').all()
    serializer_class = VenteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        return VenteCreateSerializer if self.action == 'create' else VenteSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_patient_user and hasattr(self.request.user, 'patient_profile'):
            return qs.filter(patient__user=self.request.user)
        return qs

class LigneVenteViewSet(viewsets.ModelViewSet):
    queryset = LigneVente.objects.select_related('vente', 'produit').all()
    serializer_class = LigneVenteSerializer
    permission_classes = [permissions.IsAuthenticated]

# =============================================================================
# 💰 FACTURATION & PAIEMENTS
# =============================================================================
class ActeMedicalViewSet(viewsets.ModelViewSet):
    queryset = ActeMedical.objects.all()
    serializer_class = ActeMedicalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['libelle', 'code_acte']

class FactureViewSet(viewsets.ModelViewSet):
    queryset = Facture.objects.select_related('patient').prefetch_related('lignes_actes__acte', 'lignes_pharmacie__produit', 'paiements').all()
    serializer_class = FactureSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        return FactureCreateSerializer if self.action == 'create' else FactureSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_patient_user and hasattr(self.request.user, 'patient_profile'):
            return qs.filter(patient__user=self.request.user)
        return qs
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        facture = self.get_object()
        serializer = PaiementSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save(facture=facture)
                total_paye = facture.paiements.aggregate(t=Sum('montant_verse'))['t'] or 0
                facture.statut_paiement = 'Payé' if total_paye >= facture.montant_total else 'Partiel'
                facture.save(update_fields=['statut_paiement'])
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.select_related('facture__patient').all()
    serializer_class = PaiementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_patient_user and hasattr(self.request.user, 'patient_profile'):
            return qs.filter(facture__patient__user=self.request.user)
        return qs

class LigneFactureActeViewSet(viewsets.ModelViewSet):
    queryset = LigneFactureActe.objects.select_related('facture', 'acte').all()
    serializer_class = LigneFactureActeSerializer
    permission_classes = [permissions.IsAuthenticated]

class LigneFacturePharmacieViewSet(viewsets.ModelViewSet):
    queryset = LigneFacturePharmacie.objects.select_related('facture', 'produit').all()
    serializer_class = LigneFacturePharmacieSerializer
    permission_classes = [permissions.IsAuthenticated]

# =============================================================================
# 🔍 UTILITAIRES
# =============================================================================
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def specialties_list(request):
    user = request.user
    if user.is_doctor and hasattr(user, 'doctor_profile'):
        return Response({
            'current': user.doctor_profile.specialty,
            'name': user.doctor_profile.get_specialty_display()
        })
    if user.is_admin:
        return Response({
            'available': [
                {'id': k, 'name': v}
                for k, v in dict(Consultation._meta.get_field('service').choices).items()
            ]
        })
    return Response({'available': []})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def quick_search(request):
    query = request.query_params.get('q', '').strip()
    stype = request.query_params.get('type', 'all')
    res = {'patients': [], 'doctors': []}
    
    if len(query) >= 2:
        if stype in ['patients', 'all']:
            patients = Patient.objects.filter(
                Q(nom__icontains=query) | Q(prenoms__icontains=query) | Q(code_patient__icontains=query)
            )[:10]
            res['patients'] = [
                {'id': p.id, 'label': f"{p.nom} {p.prenoms}", 'code': p.code_patient}
                for p in patients
            ]
        if stype in ['doctors', 'all'] and request.user.is_admin:
            doctors = User.objects.filter(
                Q(role='doctor') & (
                    Q(first_name__icontains=query) |
                    Q(last_name__icontains=query) |
                    Q(username__icontains=query)
                )
            )[:10]
            res['doctors'] = [
                {
                    'id': d.id,
                    'label': f"Dr. {d.last_name} {d.first_name}",
                    'specialty': d.doctor_profile.specialty if hasattr(d, 'doctor_profile') else ''
                }
                for d in doctors
            ]
    return Response(res)