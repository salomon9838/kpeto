# doctor/admin.py
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    DoctorProfile, Patient, Antecedent, Consultation,
    ExamenOphtalmo, InterventionChirurgicale, ExamenUrologie, ExamenCardiologie,
    Ordonnance, MedicamentPrescrit, AnalyseLabo, AnalyseRadio,
    CategorieProduit, Produit, Approvisionnement, Vente, LigneVente,
    ActeMedical, Facture, Paiement, LigneFactureActe, LigneFacturePharmacie,
    MembreFamilial, EntreeCarnetMedical
)

User = get_user_model()

# =============================================================================
# 1. ADMINISTRATION UTILISATEURS & PROFILS MÉDECINS
# =============================================================================
class DoctorProfileInline(admin.StackedInline):
    model = DoctorProfile
    can_delete = False
    verbose_name_plural = 'Profil Médecin'
    extra = 0  # Ne pas afficher de formulaire vide par défaut
    fields = ('matricule', 'specialty', 'is_active')

class CustomUserAdmin(BaseUserAdmin):
    inlines = (DoctorProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_verified', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active', 'is_verified', 'groups')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')
    ordering = ('-date_joined',)

    # Configuration des champs pour l'ajout/modification
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Informations personnelles', {'fields': ('first_name', 'last_name', 'email', 'phone', 'avatar')}),
        ('Rôles & Sécurité', {'fields': ('role', 'specialty', 'is_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'phone', 'role', 'password1', 'password2'),
        }),
    )

# Désenregistrement sécurisé du User par défaut + réenregistrement avec notre config
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass
admin.site.register(User, CustomUserAdmin)

# =============================================================================
# 2. PATIENTS & DOSSIER MÉDICAL
# =============================================================================
@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('code_patient', 'nom', 'prenoms', 'age', 'sexe', 'telephone', 'est_assure')
    search_fields = ('nom', 'prenoms', 'code_patient', 'telephone')
    list_filter = ('sexe', 'est_assure', 'created_at')
    readonly_fields = ('code_patient', 'created_at', 'updated_at')
    fieldsets = (
        ('Identité', {'fields': ('code_patient', 'nom', 'prenoms', 'age', 'sexe')}),
        ('Contact', {'fields': ('telephone', 'adresse', 'profession')}),
        ('Assurance & Urgence', {'fields': ('est_assure', 'contact_urgence_nom', 'contact_urgence_tel')}),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )

@admin.register(Antecedent)
class AntecedentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'tabac', 'alcool', 'activite_physique')
    search_fields = ('patient__nom', 'patient__prenoms')
    readonly_fields = ('patient',)

@admin.register(MembreFamilial)
class MembreFamilialAdmin(admin.ModelAdmin):
    list_display = ('patient', 'nom', 'prenom', 'lien_parente', 'sexe', 'telephone')
    list_filter = ('lien_parente', 'sexe')
    search_fields = ('nom', 'prenom', 'patient__nom')

@admin.register(EntreeCarnetMedical)
class EntreeCarnetMedicalAdmin(admin.ModelAdmin):
    list_display = ('membre_familial', 'date', 'type_service', 'medecin')
    list_filter = ('type_service', 'date')
    search_fields = ('membre_familial__nom', 'diagnostic', 'traitement')

# =============================================================================
# 3. CONSULTATIONS & SPÉCIALITÉS (AVEC INLINES)
# =============================================================================
# Inlines pour les examens spécialisés (Stacked = champ large)
class ExamenOphtalmoInline(admin.StackedInline):
    model = ExamenOphtalmo
    can_delete = False
    extra = 0

class InterventionChirurgicaleInline(admin.StackedInline):
    model = InterventionChirurgicale
    can_delete = False
    extra = 0

class ExamenUrologieInline(admin.StackedInline):
    model = ExamenUrologie
    can_delete = False
    extra = 0

class ExamenCardiologieInline(admin.StackedInline):
    model = ExamenCardiologie
    can_delete = False
    extra = 0

# Inlines pour les sorties (Tabular = tableau compact)
class MedicamentPrescritInline(admin.TabularInline):
    model = MedicamentPrescrit
    extra = 0

class OrdonnanceInline(admin.StackedInline):
    model = Ordonnance
    can_delete = False
    extra = 0
    # Pour afficher les médicaments directement dans l'ordonnance
    inlines = [MedicamentPrescritInline]

class AnalyseLaboInline(admin.TabularInline):
    model = AnalyseLabo
    extra = 0

class AnalyseRadioInline(admin.TabularInline):
    model = AnalyseRadio
    extra = 0

@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    # Combinaison de tous les inlines pertinents
    inlines = [
        ExamenOphtalmoInline, InterventionChirurgicaleInline, 
        ExamenUrologieInline, ExamenCardiologieInline,
        OrdonnanceInline, AnalyseLaboInline, AnalyseRadioInline
    ]
    list_display = ('id', 'patient', 'doctor', 'service', 'centre_medical', 'date_consultation')
    list_filter = ('service', 'date_consultation', 'centre_medical')
    search_fields = ('patient__nom', 'patient__prenoms', 'doctor__username', 'motif_consultation')
    readonly_fields = ('date_consultation', 'created_at', 'updated_at')
    date_hierarchy = 'date_consultation'
    ordering = ('-date_consultation',)
    
    fieldsets = (
        ('Général', {'fields': ('patient', 'doctor', 'service', 'centre_medical', 'date_consultation')}),
        ('Soignant', {'fields': ('nom_soignant', 'tel_soignant')}),
        ('Clinique', {'fields': ('motif_consultation', 'histoire_maladie', 'signes_fonctionnels', 'examen_physique', 'observations_cliniques')}),
        ('Constantes', {'fields': ('poids', 'taille', 'temperature', 'ta_bras_gauche', 'ta_bras_droit', 'pouls')}),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )

# =============================================================================
# 4. PHARMACIE & STOCK
# =============================================================================
@admin.register(CategorieProduit)
class CategorieProduitAdmin(admin.ModelAdmin):
    list_display = ('nom', 'description')
    search_fields = ('nom',)

@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display = ('code_produit', 'designation', 'categorie', 'stock_actuel', 'stock_alerte', 'prix_unitaire_vente')
    list_filter = ('categorie', 'date_peremption')
    search_fields = ('code_produit', 'designation')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('categorie')

@admin.register(Approvisionnement)
class ApprovisionnementAdmin(admin.ModelAdmin):
    list_display = ('produit', 'quantite_recue', 'fournisseur', 'date_reception', 'numero_lot')
    list_filter = ('date_reception', 'fournisseur')
    search_fields = ('produit__designation', 'fournisseur')

# =============================================================================
# 5. VENTES & FACTURATION
# =============================================================================
class LigneVenteInline(admin.TabularInline):
    model = LigneVente
    extra = 0
    readonly_fields = ('sous_total',)

@admin.register(Vente)
class VenteAdmin(admin.ModelAdmin):
    inlines = (LigneVenteInline,)
    list_display = ('numero_facture', 'patient', 'date_vente', 'montant_total', 'statut_paiement')
    list_filter = ('statut_paiement', 'date_vente')
    search_fields = ('numero_facture', 'patient__nom', 'patient__code_patient')
    readonly_fields = ('date_vente', 'montant_total')

@admin.register(ActeMedical)
class ActeMedicalAdmin(admin.ModelAdmin):
    list_display = ('code_acte', 'libelle', 'montant')
    search_fields = ('libelle', 'code_acte')

class LigneFactureActeInline(admin.TabularInline):
    model = LigneFactureActe
    extra = 0
    readonly_fields = ('sous_total',)

class LigneFacturePharmacieInline(admin.TabularInline):
    model = LigneFacturePharmacie
    extra = 0
    readonly_fields = ('sous_total',)

class PaiementInline(admin.TabularInline):
    model = Paiement
    extra = 0
    readonly_fields = ('date_paiement',)

@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    inlines = (LigneFactureActeInline, LigneFacturePharmacieInline, PaiementInline)
    list_display = ('numero_facture', 'patient', 'date_emission', 'montant_total', 'montant_patient', 'statut_paiement')
    list_filter = ('statut_paiement', 'date_emission')
    search_fields = ('numero_facture', 'patient__nom', 'patient__code_patient')
    readonly_fields = ('date_emission', 'montant_total', 'montant_patient')
    date_hierarchy = 'date_emission'

@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ('facture', 'date_paiement', 'montant_verse', 'mode_paiement', 'reference_transaction')
    list_filter = ('mode_paiement', 'date_paiement')
    search_fields = ('facture__numero_facture', 'reference_transaction')
    readonly_fields = ('date_paiement',)