from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *

User = get_user_model()

# =============================================================================
# UTILISATEURS & AUTHENTIFICATION
# =============================================================================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'specialty', 'is_verified', 'avatar']
        read_only_fields = ['id', 'is_verified']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone', 'role']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class DoctorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = DoctorProfile
        fields = ['id', 'user', 'matricule', 'specialty', 'is_active', 'created_at']


# =============================================================================
# PATIENTS
# =============================================================================
class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Patient
        fields = '__all__'


class AntecedentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Antecedent
        fields = '__all__'


class MembreFamilialSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembreFamilial
        fields = '__all__'


class EntreeCarnetMedicalSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntreeCarnetMedical
        fields = '__all__'


# =============================================================================
# UTILISATEURS & AUTHENTIFICATION (Suite)
# =============================================================================
class DoctorCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    matricule = serializers.CharField(max_length=50)
    specialty = serializers.ChoiceField(choices=[
        ('ophtalmo', '👁️ Ophtalmologie'),
        ('chirurgie', '🔪 Chirurgie'),
        ('urologie', '🧪 Urologie'),
        ('cardiologie', '❤️ Cardiologie'),
        ('general', '🩺 Médecine Générale'),
    ])
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone', 'matricule', 'specialty']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        matricule = validated_data.pop('matricule')
        specialty = validated_data.pop('specialty')
        
        # Créer l'utilisateur médecin
        user = User(**validated_data)
        user.role = 'doctor'
        user.set_password(password)
        user.save()
        
        # Créer le profil médecin
        DoctorProfile.objects.create(
            user=user,
            matricule=matricule,
            specialty=specialty
        )
        
        return user


# =============================================================================
# CONSULTATIONS
# =============================================================================

class ConsultationSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source='patient.nom', read_only=True)
    patient_prenoms = serializers.CharField(source='patient.prenoms', read_only=True)
    doctor_username = serializers.CharField(source='doctor.username', read_only=True)
    
    class Meta:
        model = Consultation
        fields = [
            'id',  # ← ✅ CETTE LIGNE EST OBLIGATOIRE
            'patient',
            'patient_nom',
            'patient_prenoms',
            'doctor',
            'doctor_username',
            'date_consultation',
            'service',
            'centre_medical',
            'nom_soignant',
            'tel_soignant',
            'motif_consultation',
            'histoire_maladie',
            'signes_fonctionnels',
            'poids',
            'taille',
            'temperature',
            'ta_bras_gauche',
            'ta_bras_droit',
            'pouls',
            'examen_physique',
              'observations_cliniques',
            'created_at',
        ]

        read_only_fields = ['id', 'date_consultation', 'created_at']


class ConsultationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consultation
        fields = [
            'id',
            'patient', 'service', 'centre_medical', 'nom_soignant', 'tel_soignant',
            'motif_consultation', 'histoire_maladie', 'signes_fonctionnels',
            'poids', 'taille', 'temperature', 'ta_bras_gauche', 'ta_bras_droit', 'pouls',
            'examen_physique', 'observations_cliniques'
        ]


class ConsultationListSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source='patient.nom')
    patient_prenoms = serializers.CharField(source='patient.prenoms')
    doctor_username = serializers.CharField(source='doctor.username', read_only=True)
    
    class Meta:
        model = Consultation
        fields = [
            'id', 'patient', 'patient_nom', 'patient_prenoms', 'doctor', 'doctor_username',
            'date_consultation', 'service', 'centre_medical', 'nom_soignant', 'created_at'
        ]


class ConsultationDetailSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    doctor = UserSerializer(read_only=True)
    
    class Meta:
        model = Consultation
        fields = '__all__'



# =============================================================================
# SPÉCIALITÉS
# =============================================================================
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
# ORDONNANCES & MÉDICAMENTS
# =============================================================================
class MedicamentPrescritSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicamentPrescrit
        fields = ['id', 'ordonnance', 'designation', 'posologie', 'quantite', 'duree']


class OrdonnanceSerializer(serializers.ModelSerializer):
    medicaments = MedicamentPrescritSerializer(many=True, read_only=True)
    patient_nom = serializers.CharField(source='consultation.patient.nom', read_only=True)
    patient_prenoms = serializers.CharField(source='consultation.patient.prenoms', read_only=True)
    consultation_service = serializers.CharField(source='consultation.service', read_only=True)
    
    class Meta:
        model = Ordonnance
        fields = ['id', 'consultation', 'date_prescription', 'medicaments', 'patient_nom', 'patient_prenoms', 'consultation_service']


class OrdonnanceCreateSerializer(serializers.ModelSerializer):
    medicaments = MedicamentPrescritSerializer(many=True, required=False)
    
    class Meta:
        model = Ordonnance
        fields = ['id','consultation', 'medicaments']
    
    def create(self, validated_data):
        medicaments_data = validated_data.pop('medicaments', [])
        ordonnance = Ordonnance.objects.create(**validated_data)
        
        for med_data in medicaments_data:
            MedicamentPrescrit.objects.create(ordonnance=ordonnance, **med_data)
        
        return ordonnance


# =============================================================================
# ANALYSES (LABO & RADIO)
# =============================================================================
class AnalyseLaboSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source='consultation.patient.nom', read_only=True)
    consultation_service = serializers.CharField(source='consultation.service', read_only=True)
    
    class Meta:
        model = AnalyseLabo
        fields = [
            'id', 'consultation', 'patient', 'service', 'centre_labo', 'nom_soignant',
            'tel_soignant', 'analyses_demandees', 'motif', 'resultats', 'date_prelevement',
            'date_demande', 'patient_nom', 'consultation_service'
        ]
        read_only_fields = ['id', 'date_demande', 'patient_nom', 'consultation_service']


class AnalyseRadioSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source='consultation.patient.nom', read_only=True)
    consultation_service = serializers.CharField(source='consultation.service', read_only=True)
    
    class Meta:
        model = AnalyseRadio
        fields = [
            'id', 'consultation', 'centre_radio', 'nom_soignant', 'tel_soignant',
            'type_analyse', 'region_a_examiner', 'motif', 'date_demande',
            'patient_nom', 'consultation_service'
        ]
        read_only_fields = ['id', 'date_demande', 'patient_nom', 'consultation_service']


# =============================================================================
# PHARMACIE & STOCK
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
        fields = [
            'id', 'code_produit', 'designation', 'categorie', 'categorie_nom',
            'forme_galenique', 'prix_unitaire_achat', 'prix_unitaire_vente',
            'stock_actuel', 'stock_alerte', 'date_peremption', 'emplacement', 'is_low_stock'
        ]


class ApprovisionnementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Approvisionnement
        fields = '__all__'


class LigneVenteSerializer(serializers.ModelSerializer):
    produit_designation = serializers.CharField(source='produit.designation', read_only=True)
    
    class Meta:
        model = LigneVente
        fields = ['id', 'vente', 'produit', 'produit_designation', 'quantite', 'prix_unitaire_moment_vente', 'sous_total']


class VenteSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source='patient.nom', read_only=True)
    lignes = LigneVenteSerializer(many=True, read_only=True)
    
    class Meta:
        model = Vente
        fields = [
            'id', 'numero_facture', 'patient', 'patient_nom', 'date_vente',
            'montant_total', 'statut_paiement', 'lignes'
        ]


class VenteCreateSerializer(serializers.ModelSerializer):
    lignes = serializers.ListField(
        child=serializers.DictField(),
        write_only=True
    )
    
    class Meta:
        model = Vente
        fields = ['patient', 'numero_facture', 'lignes', 'montant_total']
    
    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        vente = Vente.objects.create(**validated_data)
        
        for ligne_data in lignes_data:
            produit = Produit.objects.get(id=ligne_data['produit_id'])
            quantite = ligne_data['quantite']
            
            # Vérifier stock
            if produit.stock_actuel < quantite:
                raise serializers.ValidationError(f"Stock insuffisant pour {produit.designation}")
            
            # Déduire stock
            produit.stock_actuel -= quantite
            produit.save(update_fields=['stock_actuel'])
            
            LigneVente.objects.create(
                vente=vente,
                produit=produit,
                quantite=quantite,
                prix_unitaire_moment_vente=produit.prix_unitaire_vente,
                sous_total=quantite * produit.prix_unitaire_vente
            )
        
        return vente


# =============================================================================
# FACTURATION & PAIEMENTS
# =============================================================================
class ActeMedicalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActeMedical
        fields = '__all__'


class LigneFactureActeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneFactureActe
        fields = '__all__'


class LigneFacturePharmacieSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneFacturePharmacie
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = ['id', 'facture', 'date_paiement', 'montant_verse', 'mode_paiement', 'reference_transaction']


class FactureSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source='patient.nom', read_only=True)
    paiements = PaymentSerializer(many=True, read_only=True)
    lignes_actes = LigneFactureActeSerializer(many=True, read_only=True)
    lignes_pharmacie = LigneFacturePharmacieSerializer(many=True, read_only=True)
    
    class Meta:
        model = Facture
        fields = [
            'id', 'numero_facture', 'patient', 'patient_nom', 'consultation',
            'date_emission', 'montant_total', 'montant_assurance', 'montant_patient',
            'statut_paiement', 'paiements', 'lignes_actes', 'lignes_pharmacie'
        ]


class FactureCreateSerializer(serializers.ModelSerializer):
    lignes_actes = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    lignes_pharmacie = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    
    class Meta:
        model = Facture
        fields = ['patient', 'consultation', 'lignes_actes', 'lignes_pharmacie', 'montant_assurance']
    
    def create(self, validated_data):
        lignes_actes_data = validated_data.pop('lignes_actes', [])
        lignes_pharmacie_data = validated_data.pop('lignes_pharmacie', [])
        
        # Calculer montants
        montant_total = 0
        montant_assurance = validated_data.get('montant_assurance', 0)
        
        # Créer facture
        facture = Facture.objects.create(**validated_data)
        
        # Lignes actes
        for ligne_data in lignes_actes_data:
            acte = ActeMedical.objects.get(id=ligne_data['acte_id'])
            quantite = ligne_data.get('quantite', 1)
            sous_total = quantite * acte.montant
            montant_total += sous_total
            
            LigneFactureActe.objects.create(
                facture=facture,
                acte=acte,
                quantite=quantite,
                prix_unitaire=acte.montant,
                sous_total=sous_total
            )
        
        # Lignes pharmacie
        for ligne_data in lignes_pharmacie_data:
            produit = Produit.objects.get(id=ligne_data['produit_id'])
            quantite = ligne_data['quantite']
            sous_total = quantite * produit.prix_unitaire_vente
            montant_total += sous_total
            
            LigneFacturePharmacie.objects.create(
                facture=facture,
                produit=produit,
                quantite=quantite,
                prix_unitaire=produit.prix_unitaire_vente,
                sous_total=sous_total
            )
        
        # Mettre à jour montants
        facture.montant_total = montant_total
        facture.montant_patient = montant_total - montant_assurance
        facture.statut_paiement = 'Non payé' if facture.montant_patient > 0 else 'Payé'
        facture.save(update_fields=['montant_total', 'montant_patient', 'statut_paiement'])
        
        return facture


# =============================================================================
# NOTIFICATIONS
# =============================================================================
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'recipient_role', 'title', 'message', 'data', 'read', 'created_at']


# =============================================================================
# WORKFLOW PHARMACIE/CAISSE
# =============================================================================
class PrescriptionProductSerializer(serializers.Serializer):
    """Serializer pour récupérer les produits d'une ordonnance avec stock"""
    id = serializers.IntegerField(source='medicament.id')
    name = serializers.CharField(source='medicament.designation')
    quantity = serializers.IntegerField(default=1)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, source='medicament.prix_unitaire_vente')
    stock_available = serializers.IntegerField(source='medicament.stock_actuel')
    prescription_id = serializers.IntegerField(source='medicament.id')


class CaisseDataSerializer(serializers.Serializer):
    """Serializer pour les données de caisse"""
    ordonnance_id = serializers.IntegerField()
    consultation_id = serializers.IntegerField()
    patient_id = serializers.IntegerField()
    patient_name = serializers.CharField()
    products = serializers.ListField(child=serializers.DictField())
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    stock_alerts = serializers.ListField(child=serializers.DictField(), required=False)


class PaymentRequestSerializer(serializers.Serializer):
    """Serializer pour les demandes de paiement"""
    consultation = serializers.IntegerField()
    ordonnance = serializers.IntegerField()
    patient = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_method = serializers.CharField()
    phone_number = serializers.CharField()
    centre = serializers.CharField()
    service = serializers.CharField()
    type = serializers.CharField()