# doctor/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from django.db import transaction
from .models import (
    User, DoctorProfile, Patient, Antecedent, Consultation,
    ExamenOphtalmo, InterventionChirurgicale, ExamenUrologie, ExamenCardiologie,
    Ordonnance, MedicamentPrescrit, AnalyseLabo, AnalyseRadio,
    CategorieProduit, Produit, Approvisionnement, Vente, LigneVente,
    ActeMedical, Facture, Paiement, LigneFactureActe, LigneFacturePharmacie,
    MembreFamilial, EntreeCarnetMedical
)

User = get_user_model()

# =============================================================================
# 1. AUTHENTIFICATION & GESTION UTILISATEURS
# =============================================================================

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'role_display', 'phone', 'specialty', 'is_verified', 
            'is_active', 'date_joined', 'avatar'
        ]
        read_only_fields = ['id', 'date_joined', 'is_verified']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm', 'phone']
        extra_kwargs = {
            'email': {'required': True, 'validators': [UniqueValidator(queryset=User.objects.all())]},
            'username': {'validators': [UniqueValidator(queryset=User.objects.all())]}
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs
    
    def create(self, validated_data):
        return User.objects.create_user(**validated_data, is_verified=False)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if not username or not password:
            raise serializers.ValidationError("Nom d'utilisateur et mot de passe requis.")
        
        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Identifiants incorrects.")
        if not user.is_active:
            raise serializers.ValidationError("Compte désactivé.")
        if user.role != 'admin' and not user.is_verified:
            raise serializers.ValidationError("Compte en attente de vérification admin.")
            
        attrs['user'] = user
        return attrs


class DoctorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    specialty_display = serializers.CharField(source='get_specialty_display', read_only=True)
    
    class Meta:
        model = DoctorProfile
        fields = ['id', 'user', 'matricule', 'specialty', 'specialty_display', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class DoctorCreateSerializer(serializers.ModelSerializer):
    # Champs User
    username = serializers.CharField(validators=[UniqueValidator(queryset=User.objects.all())])
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    email = serializers.EmailField(required=True, validators=[UniqueValidator(queryset=User.objects.all())])
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    phone = serializers.CharField(required=False)
    
    # Champs DoctorProfile
    matricule = serializers.CharField(required=True)
    specialty = serializers.ChoiceField(choices=DoctorProfile._meta.get_field('specialty').choices)
    
    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name', 'phone', 'matricule', 'specialty']
    
    def create(self, validated_data):
        matricule = validated_data.pop('matricule')
        specialty = validated_data.pop('specialty')
        
        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['username'],
                password=validated_data['password'],
                email=validated_data.get('email', ''),
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                phone=validated_data.get('phone', ''),
                role='doctor',
                is_active=True,
                is_verified=True
            )
            DoctorProfile.objects.create(user=user, matricule=matricule, specialty=specialty)
        return user

# =============================================================================
# 2. PATIENTS & DOSSIER MÉDICAL
# =============================================================================

class PatientSerializer(serializers.ModelSerializer):
    sexe_display = serializers.CharField(source='get_sexe_display', read_only=True)
    
    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AntecedentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Antecedent
        fields = '__all__'


class MembreFamilialSerializer(serializers.ModelSerializer):
    sexe_display = serializers.CharField(source='get_sexe_display', read_only=True)
    lien_parente_display = serializers.CharField(source='get_lien_parente_display', read_only=True)
    
    class Meta:
        model = MembreFamilial
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class EntreeCarnetMedicalSerializer(serializers.ModelSerializer):
    type_service_display = serializers.CharField(source='get_type_service_display', read_only=True)
    membre = MembreFamilialSerializer(source='membre_familial', read_only=True)
    
    class Meta:
        model = EntreeCarnetMedical
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

# =============================================================================
# 3. CONSULTATIONS & SPÉCIALITÉS
# =============================================================================

class ConsultationListSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source='patient.nom', read_only=True)
    doctor_nom = serializers.CharField(source='doctor.last_name', read_only=True)
    service_display = serializers.CharField(source='get_service_display', read_only=True)
    
    class Meta:
        model = Consultation
        fields = ['id', 'patient', 'patient_nom', 'doctor', 'doctor_nom', 'service', 
                  'service_display', 'date_consultation', 'motif_consultation', 'centre_medical']


class ConsultationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consultation
        fields = [
            'patient', 'service', 'centre_medical', 'nom_soignant', 'tel_soignant',
            'motif_consultation', 'histoire_maladie', 'signes_fonctionnels',
            'poids', 'taille', 'temperature', 'ta_bras_gauche', 'ta_bras_droit', 'pouls',
            'examen_physique', 'observations_cliniques'
        ]
    
    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.user.is_doctor:
            doctor_profile = getattr(request.user, 'doctor_profile', None)
            if doctor_profile and attrs.get('service') != doctor_profile.specialty:
                raise serializers.ValidationError(
                    f"Service invalide. Votre spécialité est : {doctor_profile.get_specialty_display()}"
                )
        return attrs
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_doctor:
            validated_data['doctor'] = request.user
            validated_data['nom_soignant'] = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
            validated_data['tel_soignant'] = request.user.phone or validated_data.get('tel_soignant', '')
        return super().create(validated_data)


class ConsultationDetailSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    doctor = UserSerializer(read_only=True)
    service_display = serializers.CharField(source='get_service_display', read_only=True)
    
    # Détails spécialités (read-only)
    ophtalmo_details = serializers.SerializerMethodField()
    chirurgie_details = serializers.SerializerMethodField()
    urologie_details = serializers.SerializerMethodField()
    cardiologie_details = serializers.SerializerMethodField()
    
    # Sorties liées
    ordonnance = serializers.SerializerMethodField()
    analyses_labo = serializers.SerializerMethodField()
    analyses_radio = serializers.SerializerMethodField()
    
    class Meta:
        model = Consultation
        fields = '__all__'
        read_only_fields = ['id', 'date_consultation', 'created_at', 'updated_at']
    
    def get_ophtalmo_details(self, obj):
        return ExamenOphtalmoSerializer(obj.ophtalmo_details).data if hasattr(obj, 'ophtalmo_details') else None
    def get_chirurgie_details(self, obj):
        return InterventionChirurgicaleSerializer(obj.chirurgie_details).data if hasattr(obj, 'chirurgie_details') else None
    def get_urologie_details(self, obj):
        return ExamenUrologieSerializer(obj.urologie_details).data if hasattr(obj, 'urologie_details') else None
    def get_cardiologie_details(self, obj):
        return ExamenCardiologieSerializer(obj.cardiologie_details).data if hasattr(obj, 'cardiologie_details') else None
    def get_ordonnance(self, obj):
        return OrdonnanceSerializer(obj.ordonnance).data if hasattr(obj, 'ordonnance') else None
    def get_analyses_labo(self, obj):
        return AnalyseLaboSerializer(obj.analyses_labo.all(), many=True).data
    def get_analyses_radio(self, obj):
        return AnalyseRadioSerializer(obj.analyses_radio.all(), many=True).data


# Serializer de base (fallback pour list/update)
class ConsultationSerializer(ConsultationListSerializer):
    pass


# Serializers Spécialités (CRUD standard)
class ExamenOphtalmoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamenOphtalmo
        fields = '__all__'

class InterventionChirurgicaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterventionChirurgicale
        fields = '__all__'

class ExamenUrologieSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamenUrologie
        fields = '__all__'

class ExamenCardiologieSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamenCardiologie
        fields = '__all__'

# =============================================================================
# 4. ORDONNANCES & ANALYSES
# =============================================================================

class MedicamentPrescritSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicamentPrescrit
        fields = '__all__'


class OrdonnanceSerializer(serializers.ModelSerializer):
    medicaments = MedicamentPrescritSerializer(many=True, read_only=True)
    patient_nom = serializers.CharField(source='consultation.patient.nom', read_only=True)
    
    class Meta:
        model = Ordonnance
        fields = '__all__'
        read_only_fields = ['id', 'date_prescription']


class OrdonnanceCreateSerializer(serializers.ModelSerializer):
    medicaments = MedicamentPrescritSerializer(many=True)
    
    class Meta:
        model = Ordonnance
        fields = ['consultation', 'medicaments']
    
    def create(self, validated_data):
        med_data = validated_data.pop('medicaments')
        with transaction.atomic():
            ord = Ordonnance.objects.create(**validated_data)
            for m in med_data:
                MedicamentPrescrit.objects.create(ordonnance=ord, **m)
        return ord


class AnalyseLaboSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source='consultation.patient.nom', read_only=True)
    class Meta:
        model = AnalyseLabo
        fields = '__all__'
        read_only_fields = ['id', 'date_demande']


class AnalyseRadioSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source='consultation.patient.nom', read_only=True)
    class Meta:
        model = AnalyseRadio
        fields = '__all__'
        read_only_fields = ['id', 'date_demande']

# =============================================================================
# 5. PHARMACIE & VENTES
# =============================================================================

class CategorieProduitSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategorieProduit
        fields = '__all__'


class ProduitSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Produit
        fields = '__all__'
        read_only_fields = ['id']


class ApprovisionnementSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.designation', read_only=True)
    
    class Meta:
        model = Approvisionnement
        fields = '__all__'
        read_only_fields = ['id', 'date_reception']
    
    def create(self, validated_data):
        with transaction.atomic():
            appro = Approvisionnement.objects.create(**validated_data)
            appro.produit.stock_actuel += appro.quantite_recue
            appro.produit.save(update_fields=['stock_actuel'])
        return appro


class LigneVenteSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.designation', read_only=True)
    class Meta:
        model = LigneVente
        fields = '__all__'
        read_only_fields = ['id', 'sous_total']


class VenteSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source='patient.nom', read_only=True)
    lignes = LigneVenteSerializer(many=True, read_only=True)
    class Meta:
        model = Vente
        fields = '__all__'
        read_only_fields = ['id', 'date_vente', 'montant_total']


class VenteCreateSerializer(serializers.ModelSerializer):
    lignes = LigneVenteSerializer(many=True)
    
    class Meta:
        model = Vente
        fields = ['patient', 'numero_facture', 'statut_paiement', 'lignes']
    
    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        with transaction.atomic():
            vente = Vente.objects.create(**validated_data)
            total = 0
            for ld in lignes_data:
                prod = ld['produit']
                qty = ld['quantite']
                prix = ld['prix_unitaire_moment_vente']
                if prod.stock_actuel < qty:
                    raise serializers.ValidationError(f"Stock insuffisant pour {prod.designation}")
                prod.stock_actuel -= qty
                prod.save(update_fields=['stock_actuel'])
                LigneVente.objects.create(vente=vente, produit=prod, quantite=qty, 
                                          prix_unitaire_moment_vente=prix, sous_total=qty*prix)
                total += qty * prix
            vente.montant_total = total
            vente.save(update_fields=['montant_total'])
        return vente

# =============================================================================
# 6. FACTURATION & PAIEMENTS
# =============================================================================

class ActeMedicalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActeMedical
        fields = '__all__'


class LigneFactureActeSerializer(serializers.ModelSerializer):
    acte_libelle = serializers.CharField(source='acte.libelle', read_only=True)
    class Meta:
        model = LigneFactureActe
        fields = '__all__'
        read_only_fields = ['id', 'sous_total']


class LigneFacturePharmacieSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.designation', read_only=True)
    class Meta:
        model = LigneFacturePharmacie
        fields = '__all__'
        read_only_fields = ['id', 'sous_total']


class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = '__all__'
        read_only_fields = ['id', 'date_paiement']


class FactureSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source='patient.nom', read_only=True)
    paiements = PaiementSerializer(many=True, read_only=True)
    lignes_actes = LigneFactureActeSerializer(many=True, read_only=True)
    lignes_pharmacie = LigneFacturePharmacieSerializer(many=True, read_only=True)
    
    class Meta:
        model = Facture
        fields = '__all__'
        read_only_fields = ['id', 'date_emission', 'montant_total', 'montant_patient']


class FactureCreateSerializer(serializers.ModelSerializer):
    lignes_actes = LigneFactureActeSerializer(many=True, required=False)
    lignes_pharmacie = LigneFacturePharmacieSerializer(many=True, required=False)
    
    class Meta:
        model = Facture
        fields = ['patient', 'consultation', 'numero_facture', 'montant_assurance', 
                  'statut_paiement', 'lignes_actes', 'lignes_pharmacie']
    
    def create(self, validated_data):
        actes_data = validated_data.pop('lignes_actes', [])
        pharma_data = validated_data.pop('lignes_pharmacie', [])
        montant_assurance = validated_data.pop('montant_assurance', 0)
        
        with transaction.atomic():
            facture = Facture.objects.create(**validated_data, montant_assurance=montant_assurance)
            total = 0
            
            for ad in actes_data:
                sub = ad['quantite'] * ad['prix_unitaire']
                LigneFactureActe.objects.create(facture=facture, sous_total=sub, **ad)
                total += sub
                
            for pd in pharma_data:
                prod = pd['produit']
                qty = pd['quantite']
                if prod.stock_actuel < qty:
                    raise serializers.ValidationError(f"Stock insuffisant pour {prod.designation}")
                prod.stock_actuel -= qty
                prod.save(update_fields=['stock_actuel'])
                sub = qty * pd['prix_unitaire']
                LigneFacturePharmacie.objects.create(facture=facture, sous_total=sub, **pd)
                total += sub
                
            facture.montant_total = total
            facture.montant_patient = total - montant_assurance
            facture.save(update_fields=['montant_total', 'montant_patient'])
        return facture