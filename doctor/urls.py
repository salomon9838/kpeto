from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Admin
router.register(r'admin/users', views.AdminUserViewSet, basename='admin-users')
router.register(r'admin/doctors', views.AdminDoctorViewSet, basename='admin-doctors')

# Patients
router.register(r'patients', views.PatientViewSet, basename='patient')
router.register(r'antecedents', views.AntecedentViewSet, basename='antecedent')
router.register(r'membres-familiaux', views.MembreFamilialViewSet, basename='membre-familial')
router.register(r'carnet-medical', views.EntreeCarnetMedicalViewSet, basename='carnet-medical')

# Consultations
router.register(r'consultations', views.ConsultationViewSet, basename='consultation')
router.register(r'examens-ophtalmo', views.ExamenOphtalmoViewSet, basename='examen-ophtalmo')
router.register(r'interventions-chirurgie', views.InterventionChirurgicaleViewSet, basename='intervention-chirurgie')
router.register(r'examens-urologie', views.ExamenUrologieViewSet, basename='examen-urologie')
router.register(r'examens-cardiologie', views.ExamenCardiologieViewSet, basename='examen-cardiologie')

# Ordonnances & Analyses
router.register(r'ordonnances', views.OrdonnanceViewSet, basename='ordonnance')
router.register(r'medicaments-prescrits', views.MedicamentPrescritViewSet, basename='medicament-prescrit')
router.register(r'analyses-labo', views.AnalyseLaboViewSet, basename='analyse-labo')
router.register(r'analyses-radio', views.AnalyseRadioViewSet, basename='analyse-radio')

# Pharmacie
router.register(r'categories-produits', views.CategorieProduitViewSet, basename='categorie-produit')
router.register(r'produits', views.ProduitViewSet, basename='produit')
router.register(r'approvisionnements', views.ApprovisionnementViewSet, basename='approvisionnement')
router.register(r'ventes', views.VenteViewSet, basename='vente')
router.register(r'lignes-vente', views.LigneVenteViewSet, basename='ligne-vente')

# Facturation
router.register(r'actes-medicaux', views.ActeMedicalViewSet, basename='acte-medical')
router.register(r'factures', views.FactureViewSet, basename='facture')
router.register(r'paiements', views.PaiementViewSet, basename='paiement')
router.register(r'lignes-facture-actes', views.LigneFactureActeViewSet, basename='ligne-facture-acte')
router.register(r'lignes-facture-pharmacie', views.LigneFacturePharmacieViewSet, basename='ligne-facture-pharmacie')

urlpatterns = [
    # Auth
    path('auth/login/', views.login_view, name='login'),
    path('auth/register/patient/', views.register_patient_view, name='register-patient'),
    path('auth/register/doctor/', views.register_doctor_view, name='register-doctor'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/me/', views.me_view, name='me'),
    
    # Stats
    path('stats/', views.stats_view, name='stats'),
    
    # Profil
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Workflow Pharmacie/Caisse
    path('pharmacie/prepare/', views.prepare_products, name='prepare-products'),
    path('pharmacie/send-to-caisse/', views.send_to_caisse, name='send-to-caisse'),
    path('caisse/<int:ordonnance_id>/', views.get_caisse_data, name='get-caisse-data'),
    
    # Paiements
    path('paiements/', views.create_payment, name='create-payment'),
    path('factures/generate/', views.generate_invoice, name='generate-invoice'),
    
    # Notifications
    path('notifications/unread/', views.get_unread_notifications, name='get-unread-notifications'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),
    
    # Utilitaires
    path('specialties/', views.specialties_list, name='specialties-list'),
    path('search/', views.quick_search, name='quick-search'),
    
    # Router
    path('', include(router.urls)),

    
    # 🔧 INTERFACE DE LOGIN DRF (utile pour le navigateur en développement)
    path('api-auth/', include('rest_framework.urls')),
]

app_name = 'doctor'