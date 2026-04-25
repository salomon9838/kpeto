import logging
from datetime import timedelta
from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import authenticate, get_user_model
from django.db.utils import IntegrityError  
from django.db.models import Count, Q, F, Sum, Avg
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError

from .models import *
from .serializers import *  

logger = logging.getLogger(__name__)
User = get_user_model()

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

class IsPharmacie(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'pharmacie']

class IsCaisse(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'caisse']

# =============================================================================
# AUTHENTIFICATION
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
# STATS
# =============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_view(request):
    """Endpoint: GET /api/stats/?period=day|month|year|all"""
    period = request.query_params.get('period', 'all')
    
    logger.info(f"📊 Stats request - Period: {period}, User: {request.user}")
    
    date_filter = {}
    now = timezone.now()
    
    if period == 'day':
        date_filter['date_consultation__date'] = now.date()
    elif period == 'month':
        date_filter['date_consultation__gte'] = now - timedelta(days=30)
    elif period == 'year':
        date_filter['date_consultation__gte'] = now - timedelta(days=365)
    
    try:
        patient_filter = {}
        if period != 'all':
            if 'date_consultation__gte' in date_filter:
                patient_filter['created_at__gte'] = date_filter['date_consultation__gte']
            if 'date_consultation__date' in date_filter:
                patient_filter['created_at__date'] = date_filter['date_consultation__date']
        
        total_patients = Patient.objects.filter(**patient_filter).count()
        consultations_qs = Consultation.objects.filter(**date_filter) if date_filter else Consultation.objects.all()
        total_consultations = consultations_qs.count()
        
        consultations_urgences = consultations_qs.filter(
            Q(motif_consultation__icontains='urgence') | 
            Q(motif_consultation__icontains='urgent') |
            Q(service='urgence')
        ).count()
        
        maladies_distinctes = consultations_qs.values('service').distinct().count()
        
        par_doctor = consultations_qs.values(
            'doctor__id', 'doctor__username', 'doctor__first_name', 'doctor__last_name'
        ).annotate(
            patients=Count('patient', distinct=True),
            consultations=Count('id', distinct=True)
        ).order_by('-consultations')
        
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
        
        response_data = {
            'total_patients': total_patients,
            'total_consultations': total_consultations,
            'consultations_urgences': consultations_urgences,
            'maladies_distinctes': maladies_distinctes,
            'par_doctor': par_doctor_formatted,
            'par_service': par_service_formatted,
            'period': period,
            'generated_at': now.isoformat(),
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"❌ Error in stats_view: {str(e)}", exc_info=True)
        return Response({
            'error': 'Erreur lors du calcul des statistiques',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# =============================================================================
# ADMIN
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
    serializer_class = DoctorProfileSerializer 
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'doctor_profile__matricule', 'first_name', 'last_name']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ConsultationCreateSerializer
        return ConsultationSerializer

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
# PROFIL & STATS
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

# =============================================================================
# PATIENTS
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
            code = f"PAT-{timezone.now().strftime('%Y%m%d%H%M%S')}-{timezone.now().microsecond % 1000:03d}"
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
# CONSULTATIONS
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

# =============================================================================
# SPÉCIALITÉS
# =============================================================================
class ExamenOphtalmoViewSet(viewsets.ModelViewSet):
    queryset = ExamenOphtalmo.objects.all()
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
# ORDONNANCES & ANALYSES
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
    
    def create(self, request, *args, **kwargs):
        """Création ou réutilisation d'ordonnance"""
        consultation_id = request.data.get('consultation')
        medicaments_data = request.data.get('medicaments', [])
        
        if not consultation_id:
            return Response(
                {'consultation': ['Ce champ est obligatoire.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Vérifier si ordonnance existe déjà
            ordonnance, created = Ordonnance.objects.get_or_create(
                consultation_id=consultation_id,
                defaults={}
            )
            
            if created:
                logger.info(f"✅ Nouvelle ordonnance créée: {ordonnance.id} pour consultation {consultation_id}")
                status_code = status.HTTP_201_CREATED
            else:
                logger.info(f"ℹ️ Ordonnance {ordonnance.id} existe déjà pour consultation {consultation_id}, réutilisation...")
                status_code = status.HTTP_200_OK
                
                # Supprimer anciens médicaments si mise à jour
                if medicaments_data:
                    MedicamentPrescrit.objects.filter(ordonnance=ordonnance).delete()
                    logger.info(f"🗑️ Anciens médicaments supprimés pour ordonnance {ordonnance.id}")
            
            # Créer les médicaments
            if medicaments_data and isinstance(medicaments_data, list):
                for med_data in medicaments_data:
                    MedicamentPrescrit.objects.create(
                        ordonnance=ordonnance,
                        designation=med_data.get('designation'),
                        posologie=med_data.get('posologie'),
                        quantite=med_data.get('quantite'),
                        duree=med_data.get('duree')
                    )
                logger.info(f"💊 {len(medicaments_data)} médicament(s) créé(s) pour ordonnance {ordonnance.id}")
            
            serializer = self.get_serializer(ordonnance)
            return Response(serializer.data, status=status_code)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Marquer l'ordonnance comme payée"""
        ordonnance = self.get_object()
        payment_id = request.data.get('payment_id')
        
        ordonnance.statut = 'payee'
        ordonnance.save(update_fields=['statut'])
        
        return Response({'status': 'paid', 'ordonnance_id': ordonnance.id})
    
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Récupérer les produits d'une ordonnance avec stock"""
        ordonnance = self.get_object()
        products = []
        
        for med in ordonnance.medicaments.all():
            produit = Produit.objects.filter(designation__iexact=med.designation).first()
            products.append({
                'id': med.id,
                'name': med.designation,
                'quantity': 1,
                'price': float(produit.prix_unitaire_vente) if produit else 0,
                'stock_available': produit.stock_actuel if produit else 0,
                'prescription_id': med.id
            })
        
        return Response(products)


class MedicamentPrescritViewSet(viewsets.ModelViewSet):
    queryset = MedicamentPrescrit.objects.select_related('ordonnance__consultation__patient').all()
    serializer_class = MedicamentPrescritSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_doctor:
            return qs.filter(ordonnance__consultation__doctor=self.request.user)
        if self.request.user.is_patient_user and hasattr(self.request.user, 'patient_profile'):
            return qs.filter(ordonnance__consultation__patient__user=self.request.user)
        return qs


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
# PHARMACIE & STOCK
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
# WORKFLOW PHARMACIE/CAISSE
# =============================================================================
@api_view(['POST'])
@permission_classes([IsPharmacie])
def prepare_products(request):
    """Préparer les produits (réserver le stock)"""
    ordonnance_id = request.data.get('ordonnance_id')
    products = request.data.get('products', [])
    
    try:
        with transaction.atomic():
            for p in products:
                med = MedicamentPrescrit.objects.get(id=p['id'])
                produit = Produit.objects.select_for_update().filter(
                    designation__iexact=med.designation
                ).first()
                
                if produit and produit.stock_actuel >= p['quantity']:
                    # Réserver le stock (optionnel: créer une réservation temporaire)
                    pass
                else:
                    return Response(
                        {'error': f'Stock insuffisant pour {med.designation}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        return Response({'status': 'prepared'})
    except MedicamentPrescrit.DoesNotExist:
        return Response({'error': 'Médicament non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Erreur préparation produits: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsPharmacie])
def send_to_caisse(request):
    """Envoyer à la caisse"""
    serializer = CaisseDataSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    try:
        # Mettre à jour le statut de l'ordonnance
        ordonnance = Ordonnance.objects.get(id=data['ordonnance_id'])
        ordonnance.statut = 'en_attente_paiement'
        ordonnance.save(update_fields=['statut'])
        
        # Créer une notification pour la caisse
        Notification.objects.create(
            recipient_role='caisse',
            title='Nouvelle ordonnance à payer',
            message=f"Patient {data['patient_name']} - Montant: {data['total_amount']} FCFA",
            data={
                'ordonnance_id': data['ordonnance_id'],
                'patient_id': data['patient_id'],
                'total_amount': str(data['total_amount'])
            }
        )
        
        return Response({'status': 'sent', 'message': 'Ordonnance envoyée à la caisse'})
    except Ordonnance.DoesNotExist:
        return Response({'error': 'Ordonnance non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Erreur envoi caisse: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsCaisse])
def get_caisse_data(request, ordonnance_id):
    """Récupérer les données de caisse pour une ordonnance"""
    try:
        ordonnance = Ordonnance.objects.select_related('consultation__patient').get(id=ordonnance_id)
        
        products = []
        for med in ordonnance.medicaments.all():
            produit = Produit.objects.filter(designation__iexact=med.designation).first()
            products.append({
                'id': med.id,
                'name': med.designation,
                'quantity': 1,
                'price': float(produit.prix_unitaire_vente) if produit else 0,
            })
        
        total = sum(p['price'] * p['quantity'] for p in products)
        
        # Vérifier les alertes de stock
        stock_alerts = []
        for med in ordonnance.medicaments.all():
            produit = Produit.objects.filter(designation__iexact=med.designation).first()
            if produit and produit.stock_actuel < 1:
                stock_alerts.append({
                    'productId': med.id,
                    'productName': med.designation,
                    'required': 1,
                    'available': produit.stock_actuel
                })
        
        return Response({
            'ordonnance_id': ordonnance.id,
            'consultation_id': ordonnance.consultation.id,
            'patient_id': ordonnance.consultation.patient.id,
            'patient_name': f"{ordonnance.consultation.patient.nom} {ordonnance.consultation.patient.prenoms}",
            'products': products,
            'total_amount': total,
            'stock_alerts': stock_alerts
        })
    except Ordonnance.DoesNotExist:
        return Response({'error': 'Ordonnance non trouvée'}, status=status.HTTP_404_NOT_FOUND)

# =============================================================================
# PAIEMENTS & FACTURATION
# =============================================================================

# =============================================================================
# FACTURATION & PAIEMENTS (ViewSets manquants)
# =============================================================================
class ActeMedicalViewSet(viewsets.ModelViewSet):
    queryset = ActeMedical.objects.all()
    serializer_class = ActeMedicalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['libelle', 'code_acte']


class FactureViewSet(viewsets.ModelViewSet):
    queryset = Facture.objects.select_related('patient').prefetch_related('paiements', 'lignes_actes', 'lignes_pharmacie').all()
    serializer_class = FactureSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_patient_user and hasattr(self.request.user, 'patient_profile'):
            return qs.filter(patient__user=self.request.user)
        return qs


class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.select_related('facture').all()
    serializer_class = PaymentSerializer
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

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_payment(request):
    """Enregistrer un paiement"""
    serializer = PaymentRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    try:
        with transaction.atomic():
            # Créer ou récupérer la facture
            consultation = Consultation.objects.get(id=data['consultation'])
            ordonnance = Ordonnance.objects.get(id=data['ordonnance'])
            patient = Patient.objects.get(id=data['patient'])
            
            # Créer la facture si elle n'existe pas
            facture, created = Facture.objects.get_or_create(
                consultation=consultation,
                defaults={
                    'patient': patient,
                    'numero_facture': f"FAC-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                    'montant_total': data['amount'],
                    'montant_patient': data['amount'],
                    'statut_paiement': 'Non payé'
                }
            )
            
            # Créer le paiement
            payment = Paiement.objects.create(
                facture=facture,
                montant_verse=data['amount'],
                mode_paiement=data['payment_method'],
                reference_transaction=data.get('phone_number', '')
            )
            
            # Mettre à jour la facture
            total_paye = facture.paiements.aggregate(t=Sum('montant_verse'))['t'] or 0
            facture.statut_paiement = 'Payé' if total_paye >= facture.montant_patient else 'Partiel'
            facture.save(update_fields=['statut_paiement'])
            
            # Mettre à jour l'ordonnance
            ordonnance.statut = 'payee'
            ordonnance.save(update_fields=['statut'])
            
            # Créer des notifications
            Notification.objects.bulk_create([
                Notification(
                    recipient_role='pharmacie',
                    title='Paiement reçu',
                    message=f"Ordonnance #{ordonnance.id} prête à délivrer",
                    data={'ordonnance_id': ordonnance.id, 'patient_id': patient.id}
                ),
                Notification(
                    recipient_role='doctor',
                    title='Consultation finalisée',
                    message=f"Paiement effectué pour {patient.nom}",
                    data={'ordonnance_id': ordonnance.id, 'patient_id': patient.id, 'payment_id': payment.id}
                )
            ])
            
            return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
    
    except Consultation.DoesNotExist:
        return Response({'error': 'Consultation non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Ordonnance.DoesNotExist:
        return Response({'error': 'Ordonnance non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Erreur création paiement: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_invoice(request):
    """Générer une facture"""
    try:
        payment_id = request.data.get('payment_id')
        patient_id = request.data.get('patient_id')
        products = request.data.get('products', [])
        total = request.data.get('total', 0)
        
        payment = Paiement.objects.get(id=payment_id)
        patient = Patient.objects.get(id=patient_id)
        
        # Créer la facture
        invoice = Facture.objects.create(
            patient=patient,
            consultation=payment.facture.consultation if payment.facture else None,
            numero_facture=f"FAC-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            montant_total=total,
            montant_patient=total,
            statut_paiement='Payé'
        )
        
        # Ajouter les lignes de pharmacie
        for prod_data in products:
            produit = Produit.objects.filter(designation=prod_data['name']).first()
            if produit:
                LigneFacturePharmacie.objects.create(
                    facture=invoice,
                    produit=produit,
                    quantite=prod_data['quantity'],
                    prix_unitaire=produit.prix_unitaire_vente,
                    sous_total=produit.prix_unitaire_vente * prod_data['quantity']
                )
        
        return Response({
            'id': invoice.id,
            'numero_facture': invoice.numero_facture,
            'url': f'/api/factures/{invoice.id}/pdf/'
        })
    
    except Paiement.DoesNotExist:
        return Response({'error': 'Paiement non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Erreur génération facture: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# =============================================================================
# NOTIFICATIONS
# =============================================================================
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_unread_notifications(request):
    """Récupérer les notifications non lues"""
    role = request.user.role if hasattr(request.user, 'role') else 'patient'
    
    notifs = Notification.objects.filter(
        Q(recipient_role=role) | Q(recipient_role='all'),
        read=False
    ).order_by('-created_at')[:20]
    
    serializer = NotificationSerializer(notifs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Marquer une notification comme lue"""
    try:
        notif = Notification.objects.get(id=notification_id)
        notif.read = True
        notif.save(update_fields=['read'])
        return Response({'status': 'read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification non trouvée'}, status=status.HTTP_404_NOT_FOUND)

# =============================================================================
# UTILITAIRES
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