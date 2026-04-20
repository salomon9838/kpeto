from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import RegexValidator

# =============================================================================
# VALIDATEURS GLOBAUX
# =============================================================================
phone_validator = RegexValidator(
    regex=r'^\+228\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$',
    message="Le numéro doit être au format : +228 XX XX XX XX"
)

# =============================================================================
# UTILISATEURS & RÔLES
# =============================================================================
class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrateur'),
        ('doctor', 'Médecin'),
        ('patient', 'Patient'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    phone = models.CharField(max_length=20, validators=[phone_validator], blank=True, null=True)
    specialty = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Spécialité du médecin : ophtalmo, chirurgie, urologie, cardiologie, general"
    )
    is_verified = models.BooleanField(default=False, help_text="Compte activé par l'admin")
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_doctor(self):
        return self.role == 'doctor'
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_patient_user(self):
        return self.role == 'patient'


class DoctorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    matricule = models.CharField(max_length=50, unique=True)
    specialty = models.CharField(
        max_length=100,
        choices=[
            ('ophtalmo', '👁️ Ophtalmologie'),
            ('chirurgie', '🔪 Chirurgie'),
            ('urologie', '🧪 Urologie'),
            ('cardiologie', '❤️ Cardiologie'),
            ('general', '🩺 Médecine Générale'),
        ]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'doctor_profiles'
        verbose_name = 'Profil Médecin'
        verbose_name_plural = 'Profils Médecins'
    
    def __str__(self):
        return f"Dr. {self.user.get_full_name() or self.user.username} - {self.get_specialty_display()}"


# =============================================================================
# PATIENTS & DOSSIERS MÉDICAUX
# =============================================================================
class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='patient_profile')
    
    code_patient = models.CharField(max_length=50, unique=True)
    nom = models.CharField(max_length=100)
    prenoms = models.CharField(max_length=200)
    age = models.PositiveIntegerField()
    sexe = models.CharField(max_length=1, choices=[('M', 'Masculin'), ('F', 'Féminin')])
    telephone = models.CharField(max_length=20, validators=[phone_validator])
    adresse = models.TextField()
    profession = models.CharField(max_length=100, blank=True)
    est_assure = models.BooleanField(default=False)
    contact_urgence_nom = models.CharField(max_length=100)
    contact_urgence_tel = models.CharField(max_length=20, validators=[phone_validator])
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'patients'
        ordering = ['-created_at']
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'

    def __str__(self):
        return f"{self.nom} {self.prenoms}"


class Antecedent(models.Model):
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='antecedents')
    medico_chirurgicaux = models.TextField(blank=True)
    familiaux = models.TextField(blank=True)
    tabac = models.BooleanField(default=False)
    alcool = models.BooleanField(default=False)
    activite_physique = models.CharField(max_length=100, blank=True)
    autres_habitudes = models.TextField(blank=True)

    class Meta:
        db_table = 'antecedents'
        verbose_name = 'Antécédent'
        verbose_name_plural = 'Antécédents'

    def __str__(self):
        return f"Antécédents de {self.patient.nom}"


# =============================================================================
# FAMILLE & CARNET MÉDICAL
# =============================================================================
class MembreFamilial(models.Model):
    SEXE_CHOICES = [('M', 'Masculin'), ('F', 'Féminin'), ('A', 'Autre')]
    PARENTE_CHOICES = [
        ('pere', 'Père'), ('mere', 'Mère'), ('frere', 'Frère'),
        ('soeur', 'Sœur'), ('fils', 'Fils'), ('fille', 'Fille'),
        ('epoux', 'Époux'), ('epouse', 'Épouse'),
        ('tuteur', 'Tuteur'), ('autre', 'Autre'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='membres_familiaux')
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    date_naissance = models.DateField()
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES)
    lien_parente = models.CharField(max_length=20, choices=PARENTE_CHOICES)
    telephone = models.CharField(max_length=20, validators=[phone_validator], blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'membres_familiaux'
        verbose_name = 'Membre Familial'
        verbose_name_plural = 'Membres Familiaux'

    def __str__(self):
        return f"{self.nom} {self.prenom} ({self.get_lien_parente_display()})"


class EntreeCarnetMedical(models.Model):
    TYPE_SERVICE_CHOICES = [
        ('consultation', 'Consultation'),
        ('urgence', 'Urgence'),
        ('hospitalisation', 'Hospitalisation'),
        ('chirurgie', 'Chirurgie'),
        ('analyse', 'Analyse'),
        ('vaccination', 'Vaccination'),
        ('suivi', 'Suivi médical'),
        ('autre', 'Autre'),
    ]

    membre_familial = models.ForeignKey(MembreFamilial, on_delete=models.CASCADE, related_name='entrees_carnet')
    date = models.DateField()
    type_service = models.CharField(max_length=30, choices=TYPE_SERVICE_CHOICES)
    medecin = models.CharField(max_length=150)
    diagnostic = models.TextField(blank=True, null=True)
    traitement = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'entrees_carnet_medical'
        verbose_name = 'Entrée Carnet Médical'
        verbose_name_plural = 'Entrées Carnet Médical'

    def __str__(self):
        return f"{self.membre_familial.nom} - {self.type_service} - {self.date}"


# =============================================================================
# CONSULTATIONS
# =============================================================================
class Consultation(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='consultations')
    doctor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='consultations',
        limit_choices_to={'role': 'doctor'}
    )
    
    date_consultation = models.DateTimeField(default=timezone.now)
    service = models.CharField(max_length=100, choices=[
        ('ophtalmo', 'Ophtalmologie'),
        ('chirurgie', 'Chirurgie'),
        ('urologie', 'Urologie'),
        ('cardiologie', 'Cardiologie'),
        ('general', 'Médecine Générale'),
    ])
    
    centre_medical = models.CharField(max_length=150)
    nom_soignant = models.CharField(max_length=100)
    tel_soignant = models.CharField(max_length=20, validators=[phone_validator])
    
    motif_consultation = models.TextField()
    histoire_maladie = models.TextField(blank=True)
    signes_fonctionnels = models.TextField(blank=True)
    
    poids = models.FloatField(null=True, blank=True)
    taille = models.FloatField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    ta_bras_gauche = models.CharField(max_length=10, blank=True)
    ta_bras_droit = models.CharField(max_length=10, blank=True)
    pouls = models.IntegerField(null=True, blank=True)
    
    examen_physique = models.TextField(blank=True)
    observations_cliniques = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'consultations'
        ordering = ['-date_consultation']
        verbose_name = 'Consultation'
        verbose_name_plural = 'Consultations'

    def __str__(self):
        return f"Consultation {self.patient.nom} - {self.get_service_display()} - {self.date_consultation.date()}"


# =============================================================================
# SPÉCIALITÉS
# =============================================================================
class ExamenOphtalmo(models.Model):
    consultation = models.OneToOneField(Consultation, on_delete=models.CASCADE, related_name='ophtalmo_details')
    av_od_loin = models.CharField(max_length=20, blank=True)
    av_og_loin = models.CharField(max_length=20, blank=True)
    av_od_pres = models.CharField(max_length=20, blank=True)
    av_og_pres = models.CharField(max_length=20, blank=True)
    paupieres_annexes = models.TextField(blank=True)
    conjonctive = models.TextField(blank=True)
    cornee = models.TextField(blank=True)
    chambre_anterieure = models.TextField(blank=True)
    iris_pupille = models.TextField(blank=True)
    cristallin = models.TextField(blank=True)
    pression_intraoculaire_od = models.CharField(max_length=20, blank=True)
    pression_intraoculaire_og = models.CharField(max_length=20, blank=True)
    fond_oeil_od = models.TextField(blank=True)
    fond_oeil_og = models.TextField(blank=True)
    refraction_auto = models.TextField(blank=True)
    correction_proposee = models.TextField(blank=True)

    class Meta:
        db_table = 'examen_ophtalmo'


class InterventionChirurgicale(models.Model):
    consultation = models.OneToOneField(Consultation, on_delete=models.CASCADE, related_name='chirurgie_details')
    type_intervention = models.CharField(max_length=255)
    indication_operatoire = models.TextField()
    date_intervention = models.DateTimeField()
    chirurgien_principal = models.CharField(max_length=100)
    aide_chirurgien = models.CharField(max_length=100, blank=True)
    type_anesthesie = models.CharField(max_length=100)
    protocole_operatoire = models.TextField()
    incidents_accidents = models.TextField(blank=True)
    traitement_post_op = models.TextField()

    class Meta:
        db_table = 'intervention_chirurgicale'


class ExamenUrologie(models.Model):
    consultation = models.OneToOneField(Consultation, on_delete=models.CASCADE, related_name='urologie_details')
    dysurie = models.BooleanField(default=False)
    pollakiurie = models.BooleanField(default=False)
    brulures_mictionnelles = models.BooleanField(default=False)
    hematurie = models.BooleanField(default=False)
    incontinence = models.BooleanField(default=False)
    jet_faible = models.BooleanField(default=False)
    examen_reins = models.TextField(blank=True)
    examen_vessie = models.TextField(blank=True)
    toucher_rectal = models.TextField(blank=True)
    examen_organes_genitaux_externes = models.TextField(blank=True)
    score_ipss = models.IntegerField(null=True, blank=True)
    residu_post_mictionnel = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'examen_urologie'


class ExamenCardiologie(models.Model):
    consultation = models.OneToOneField(Consultation, on_delete=models.CASCADE, related_name='cardiologie_details')
    diabete = models.BooleanField(default=False)
    hta = models.BooleanField(default=False)
    dyslipidemie = models.BooleanField(default=False)
    heredite_cardio = models.BooleanField(default=False)
    obesite = models.BooleanField(default=False)
    sedentarite = models.BooleanField(default=False)
    auscultation_cardiaque = models.TextField(blank=True)
    palpation_pouls_peripheriques = models.TextField(blank=True)
    oedemes_membres_inferieurs = models.BooleanField(default=False)
    signes_insuffisance_cardiaque = models.TextField(blank=True)
    electrocardiogramme_ecg = models.TextField(blank=True)
    echocardiographie = models.TextField(blank=True)
    holter_tensionnel_mapa = models.TextField(blank=True)
    epreuve_effort = models.TextField(blank=True)

    class Meta:
        db_table = 'examen_cardiologie'


# =============================================================================
# ORDONNANCES & ANALYSES
# =============================================================================
class Ordonnance(models.Model):
    consultation = models.OneToOneField(Consultation, on_delete=models.CASCADE, related_name='ordonnance')
    date_prescription = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ordonnances'


class MedicamentPrescrit(models.Model):
    ordonnance = models.ForeignKey(Ordonnance, on_delete=models.CASCADE, related_name='medicaments')
    designation = models.CharField(max_length=200)
    posologie = models.CharField(max_length=200)
    quantite = models.CharField(max_length=50)
    duree = models.CharField(max_length=50)

    class Meta:
        db_table = 'medicaments_prescrits'


class AnalyseLabo(models.Model):
    consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, related_name='analyses_labo')
    centre_labo = models.CharField(max_length=150)
    analyses_demandees = models.TextField()
    date_demande = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analyses_labo'


class AnalyseRadio(models.Model):
    consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, related_name='analyses_radio')
    centre_radio = models.CharField(max_length=150)
    type_analyse = models.CharField(max_length=200)
    region_a_examiner = models.CharField(max_length=200)
    motif = models.TextField()
    date_demande = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analyses_radio'


# =============================================================================
# PHARMACIE
# =============================================================================
class CategorieProduit(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'categories_produit'


class Produit(models.Model):
    code_produit = models.CharField(max_length=50, unique=True)
    designation = models.CharField(max_length=255)
    categorie = models.ForeignKey(CategorieProduit, on_delete=models.PROTECT, related_name='produits')
    forme_galenique = models.CharField(max_length=100, blank=True)
    prix_unitaire_achat = models.DecimalField(max_digits=10, decimal_places=2)
    prix_unitaire_vente = models.DecimalField(max_digits=10, decimal_places=2)
    stock_actuel = models.IntegerField(default=0)
    stock_alerte = models.IntegerField(default=5)
    date_peremption = models.DateField()
    emplacement = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'produits'

    @property
    def is_low_stock(self):
        return self.stock_actuel <= self.stock_alerte


class Approvisionnement(models.Model):
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE, related_name='approvisionnements')
    quantite_recue = models.IntegerField()
    fournisseur = models.CharField(max_length=150, blank=True)
    date_reception = models.DateTimeField(auto_now_add=True)
    numero_lot = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'approvisionnements'


class Vente(models.Model):
    numero_facture = models.CharField(max_length=50, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.SET_NULL, null=True, blank=True, related_name='ventes')
    date_vente = models.DateTimeField(auto_now_add=True)
    montant_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    statut_paiement = models.CharField(max_length=20, choices=[
        ('Payé', 'Payé'), ('En attente', 'En attente'), ('Annulé', 'Annulé')
    ], default='Payé')

    class Meta:
        db_table = 'ventes'


class LigneVente(models.Model):
    vente = models.ForeignKey(Vente, on_delete=models.CASCADE, related_name='lignes')
    produit = models.ForeignKey(Produit, on_delete=models.PROTECT)
    quantite = models.IntegerField()
    prix_unitaire_moment_vente = models.DecimalField(max_digits=10, decimal_places=2)
    sous_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'lignes_vente'

    def save(self, *args, **kwargs):
        self.sous_total = self.quantite * self.prix_unitaire_moment_vente
        super().save(*args, **kwargs)


# =============================================================================
# FACTURATION & PAIEMENTS
# =============================================================================
class ActeMedical(models.Model):
    libelle = models.CharField(max_length=200)
    code_acte = models.CharField(max_length=50, unique=True)
    montant = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'actes_medicaux'


class Facture(models.Model):
    numero_facture = models.CharField(max_length=50, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='factures')
    consultation = models.ForeignKey(Consultation, on_delete=models.SET_NULL, null=True, blank=True, related_name='facture')
    date_emission = models.DateTimeField(auto_now_add=True)
    montant_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_assurance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_patient = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    statut_paiement = models.CharField(max_length=20, choices=[
        ('Non payé', 'Non payé'), ('Partiel', 'Partiel'), ('Payé', 'Payé')
    ], default='Non payé')

    class Meta:
        db_table = 'factures'


class Paiement(models.Model):
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='paiements')
    date_paiement = models.DateTimeField(auto_now_add=True)
    montant_verse = models.DecimalField(max_digits=12, decimal_places=2)
    mode_paiement = models.CharField(max_length=50, choices=[
        ('Espèces', 'Espèces'),
        ('Mobile Money', 'Mobile Money'),
        ('Carte Bancaire', 'Carte Bancaire'),
        ('Chèque', 'Chèque'),
        ('Assurance', 'Assurance')
    ])
    reference_transaction = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'paiements'


class LigneFactureActe(models.Model):
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='lignes_actes')
    acte = models.ForeignKey(ActeMedical, on_delete=models.PROTECT)
    quantite = models.IntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    sous_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'lignes_facture_acte'

    def save(self, *args, **kwargs):
        self.sous_total = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)


class LigneFacturePharmacie(models.Model):
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='lignes_pharmacie')
    produit = models.ForeignKey(Produit, on_delete=models.PROTECT)
    quantite = models.IntegerField()
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    sous_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'lignes_facture_pharmacie'

    def save(self, *args, **kwargs):
        self.sous_total = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)