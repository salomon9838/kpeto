# doctor/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# =============================================================================
# CONFIGURATION DU ROUTER DRF
# =============================================================================
router = DefaultRouter()

# 👨‍💼 ADMINISTRATION
router.register(r'admin/users', views.AdminUserViewSet, basename='admin-users')
router.register(r'admin/doctors', views.AdminDoctorViewSet, basename='admin-doctors')

# 📊 STATISTIQUES & DASHBOARD
router.register(r'stats', views.StatsViewSet, basename='stats')

# 👤 PATIENTS & DOSSIER MÉDICAL
router.register(r'patients', views.PatientViewSet)
router.register(r'antecedents', views.AntecedentViewSet)
router.register(r'membres-familiaux', views.MembreFamilialViewSet)
router.register(r'carnet-medical', views.EntreeCarnetMedicalViewSet)

# 🏥 CONSULTATIONS & SPÉCIALITÉS
router.register(r'consultations', views.ConsultationViewSet, basename='consultations')
router.register(r'examens-ophtalmo', views.ExamenOphtalmoViewSet)
router.register(r'interventions-chirurgie', views.InterventionChirurgicaleViewSet)
router.register(r'examens-urologie', views.ExamenUrologieViewSet)
router.register(r'examens-cardiologie', views.ExamenCardiologieViewSet)

# 💊 ORDONNANCES & ANALYSES
router.register(r'ordonnances', views.OrdonnanceViewSet)
router.register(r'medicaments-prescrits', views.MedicamentPrescritViewSet)
router.register(r'analyses-labo', views.AnalyseLaboViewSet)
router.register(r'analyses-radio', views.AnalyseRadioViewSet)

# 🏪 PHARMACIE & STOCK
router.register(r'categories-produits', views.CategorieProduitViewSet)
router.register(r'produits', views.ProduitViewSet)
router.register(r'approvisionnements', views.ApprovisionnementViewSet)

# 🛒 VENTES
router.register(r'ventes', views.VenteViewSet)
router.register(r'lignes-vente', views.LigneVenteViewSet)

# 💰 FACTURATION & PAIEMENTS
router.register(r'actes-medicaux', views.ActeMedicalViewSet)
router.register(r'factures', views.FactureViewSet)
router.register(r'paiements', views.PaiementViewSet)
router.register(r'lignes-facture-actes', views.LigneFactureActeViewSet)
router.register(r'lignes-facture-pharmacie', views.LigneFacturePharmacieViewSet)

# =============================================================================
# URLPATTERNS : ENDPOINTS PERSONNALISÉS + ROUTER
# =============================================================================
urlpatterns = [
    # 🔐 AUTHENTIFICATION
    path('auth/login/', views.login_view, name='login'),
    path('auth/register-patient/', views.register_patient_view, name='register-patient'),
    path('admin/register-doctor/', views.register_doctor_view, name='register-doctor'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/me/', views.me_view, name='me'),
    
    # 👤 PROFIL UTILISATEUR
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    
    # 🔍 UTILITAIRES
    path('specialties/', views.specialties_list, name='specialties-list'),
    path('quick-search/', views.quick_search, name='quick-search'),
    path('stats/', views.stats_view, name='stats'),
    
    # 🔄 INCLURE LES ROUTES DU ROUTER
    path('', include(router.urls)),
    
    # 🔧 INTERFACE DE LOGIN DRF (utile pour le navigateur en développement)
    path('api-auth/', include('rest_framework.urls')),
]

app_name = 'doctor'