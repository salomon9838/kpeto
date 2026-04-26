# pharmacie/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator
from doctor.models import Patient, Consultation, DoctorProfile  # ← Import depuis l'app doctor


class Pharmacy(models.Model):
    """Profil de la pharmacie"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='pharmacy_profile',
        limit_choices_to={'role__in': ['admin', 'pharmacie']}
    )
    name = models.CharField(max_length=200)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Pharmacie'
        verbose_name_plural = 'Pharmacies'
    
    def __str__(self):
        return self.name


class Category(models.Model):
    """Catégorie de médicaments"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Medicine(models.Model):
    """Médicament en stock"""
    STATUS_CHOICES = [
        ('in_stock', 'En stock'),
        ('low_stock', 'Stock faible'),
        ('out_of_stock', 'Épuisé'),
        ('expired', 'Périmé'),
    ]
    
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name='medicines')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='medicines')
    
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)  # Code médicament
    barcode = models.CharField(max_length=100, blank=True)
    
    # Prix
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Stock
    stock_quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    min_stock = models.IntegerField(default=10, validators=[MinValueValidator(0)])  # Seuil d'alerte
    max_stock = models.IntegerField(default=100, validators=[MinValueValidator(0)])
    
    # Détails
    description = models.TextField(blank=True)
    composition = models.TextField(blank=True)
    dosage_form = models.CharField(max_length=50, blank=True)  # Comprimé, Sirop, etc.
    strength = models.CharField(max_length=50, blank=True)  # 500mg, 1g, etc.
    manufacturer = models.CharField(max_length=100, blank=True)
    
    # Dates
    expiration_date = models.DateField(null=True, blank=True)
    batch_number = models.CharField(max_length=50, blank=True)
    
    # Statut
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_stock')
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Médicament'
        verbose_name_plural = 'Médicaments'
        ordering = ['name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['status']),
            models.Index(fields=['pharmacy', 'status']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    def save(self, *args, **kwargs):
        # Mise à jour automatique du statut selon le stock
        if self.stock_quantity == 0:
            self.status = 'out_of_stock'
        elif self.stock_quantity <= self.min_stock:
            self.status = 'low_stock'
        else:
            self.status = 'in_stock'
        super().save(*args, **kwargs)


class Order(models.Model):
    """Commande pharmacie"""
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En préparation'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
        ('delivered', 'Livrée'),
    ]
    
    ORDER_TYPE_CHOICES = [
        ('retrait', 'Retrait en pharmacie'),
        ('livraison', 'Livraison à domicile'),
    ]
    
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name='orders')
    
    # Lien avec consultation/patient (optionnel pour commandes directes)
    consultation = models.ForeignKey(Consultation, on_delete=models.SET_NULL, null=True, blank=True, related_name='pharmacy_orders')
    patient = models.ForeignKey(Patient, on_delete=models.SET_NULL, null=True, blank=True, related_name='pharmacy_orders')
    
    # Infos commande
    order_number = models.CharField(max_length=50, unique=True)
    order_type = models.CharField(max_length=20, choices=ORDER_TYPE_CHOICES, default='retrait')
    
    # Statut et paiement
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=[
        ('unpaid', 'Non payé'),
        ('partial', 'Partiel'),
        ('paid', 'Payé'),
    ], default='unpaid')
    
    # Montants
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Livraison
    delivery_address = models.TextField(blank=True)
    delivery_date = models.DateTimeField(null=True, blank=True)
    
    # Notes
    notes = models.TextField(blank=True)
    pharmacist_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['status']),
            models.Index(fields=['patient', 'status']),
        ]
    
    def __str__(self):
        return f"Commande #{self.order_number} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        # Génération automatique du numéro de commande
        if not self.order_number:
            today = timezone.now().strftime('%Y%m%d')
            last_order = Order.objects.filter(
                pharmacy=self.pharmacy,
                created_at__date=timezone.now().date()
            ).order_by('-id').first()
            
            if last_order:
                last_num = int(last_order.order_number.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
            
            self.order_number = f"PH-{today}-{new_num:04d}"
        
        # Calcul du total
        self.subtotal = sum(item.subtotal for item in self.items.all())
        self.total_amount = self.subtotal - self.discount + self.delivery_fee
        
        # Date de complétion
        if self.status in ['completed', 'delivered'] and not self.completed_at:
            self.completed_at = timezone.now()
        
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    """Ligne de commande"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT, related_name='order_items')
    
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    
    # Prescription info
    prescription_notes = models.TextField(blank=True)
    dosage_instructions = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Ligne de commande'
        verbose_name_plural = 'Lignes de commande'
    
    def __str__(self):
        return f"{self.medicine.name} x{self.quantity}"
    
    def save(self, *args, **kwargs):
        self.subtotal = (self.unit_price * self.quantity) - self.discount
        super().save(*args, **kwargs)
        
        # Mettre à jour le stock après validation de la commande
        if self.order.status == 'completed' and self.pk is None:  # Nouvelle ligne
            self.medicine.stock_quantity -= self.quantity
            self.medicine.save()

# pharmacie/models.py

# ... (le reste de vos imports et modèles)

class ChatMessage(models.Model):
    """Message de chat pharmacie-patient"""
    SENDER_ROLE_CHOICES = [
        ('pharmacist', 'Pharmacien'),
        ('customer', 'Patient'),
        ('doctor', 'Médecin'),
        ('admin', 'Administrateur'),
    ]
    
    # Conversation
    conversation_id = models.CharField(max_length=100, blank=True, db_index=True)
    
    # Liens contextuels
    # ✅ CORRECTION ICI : related_name unique ('pharmacy_messages')
    consultation = models.ForeignKey(
        'doctor.Consultation', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='pharmacy_messages'  # <-- CHANGÉ de 'chat_messages' à 'pharmacy_messages'
    )
    
    patient = models.ForeignKey(
        'doctor.Patient', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='pharmacy_chat_messages'
    )
    
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name='chat_messages')
    
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='pharmacy_sent_messages'  # <-- CORRECTION ICI : unique ('pharmacy_sent_messages')
    )
    
    sender_role = models.CharField(max_length=20, choices=SENDER_ROLE_CHOICES)
    
    content = models.TextField()
    attachment = models.FileField(upload_to='pharmacie/chat/', blank=True, null=True)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Message de chat pharmacie'
        verbose_name_plural = 'Messages de chat pharmacie'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender_role}: {self.content[:50]}..."
    
    def save(self, *args, **kwargs):
        if self.sender_role == 'pharmacist' and not self.pk:
            self.is_read = True
        super().save(*args, **kwargs)


class StockMovement(models.Model):
    """Historique des mouvements de stock"""
    MOVEMENT_TYPE_CHOICES = [
        ('in', 'Entrée'),
        ('out', 'Sortie'),
        ('adjustment', 'Ajustement'),
        ('return', 'Retour'),
        ('expired', 'Péremption'),
    ]
    
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='stock_movements')
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name='stock_movements')
    
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE_CHOICES)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    
    # Référence optionnelle
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_movements')
    consultation = models.ForeignKey(Consultation, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Infos
    previous_stock = models.IntegerField()
    new_stock = models.IntegerField()
    reason = models.TextField(blank=True)
    
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Mouvement de stock'
        verbose_name_plural = 'Mouvements de stock'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_movement_type_display()}: {self.medicine.name} ({self.quantity})"


        # pharmacie/models.py

# ... (vos autres modèles existants : Pharmacy, Medicine, Order, etc.)

# =============================================================================
# AJOUTEZ CES DEUX MODÈLES À LA FIN DU FICHIER
# =============================================================================

class Conversation(models.Model):
    """Conversation entre pharmacie et patient"""
    pharmacy = models.ForeignKey(
        Pharmacy, 
        on_delete=models.CASCADE, 
        related_name='conversations'
    )
    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name='pharmacy_conversations'
    )
    consultation = models.ForeignKey(
        Consultation, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='pharmacy_conversations'
    )
    
    # Métadonnées
    last_message = models.TextField(blank=True, null=True)
    last_message_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'
        ordering = ['-last_message_time', '-created_at']
        unique_together = ['pharmacy', 'patient', 'consultation']  # Une conversation unique par patient/consultation
        indexes = [
            models.Index(fields=['pharmacy', '-last_message_time']),
            models.Index(fields=['patient', 'is_active']),
        ]
    
    def __str__(self):
        patient_name = f"{self.patient.nom} {self.patient.prenoms}" if hasattr(self.patient, 'nom') else f"Patient {self.patient.id}"
        return f"Conversation avec {patient_name}"


class PharmacieMessage(models.Model):
    """Message dans une conversation pharmacie"""
    SENDER_ROLE_CHOICES = [
        ('pharmacist', 'Pharmacien'),
        ('customer', 'Patient'),
        ('doctor', 'Médecin'),
        ('admin', 'Administrateur'),
    ]
    
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='sent_pharmacy_messages'
    )
    
    # Contexte médical optionnel (pour traçabilité)
    consultation = models.ForeignKey(
        Consultation, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='pharmacy_chat_messages'
    )
    patient = models.ForeignKey(
        Patient, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='pharmacy_conversation_messages'
    )
    
    # Contenu du message
    content = models.TextField()
    sender_role = models.CharField(
        max_length=20, 
        choices=SENDER_ROLE_CHOICES,
        default='pharmacist'
    )
    
    # Pièces jointes (optionnel)
    attachment = models.FileField(
        upload_to='pharmacie/chat_attachments/', 
        blank=True, 
        null=True
    )
    
    # Statut de lecture
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Message Pharmacie'
        verbose_name_plural = 'Messages Pharmacie'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', '-created_at']),
            models.Index(fields=['sender', '-created_at']),
            models.Index(fields=['is_read', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.sender_role}: {self.content[:50]}..."
    
    def save(self, *args, **kwargs):
        # Mettre à jour la conversation avec le dernier message
        if self.conversation:
            self.conversation.last_message = self.content
            self.conversation.last_message_time = timezone.now()
            self.conversation.save(update_fields=['last_message', 'last_message_time', 'updated_at'])
        
        # Marquer comme lu automatiquement si envoyé par le pharmacien
        if self.sender_role == 'pharmacist' and not self.pk:
            self.is_read = True
        
        # Marquer comme lu à la lecture
        if self.is_read and not self.read_at:
            self.read_at = timezone.now()
        
        super().save(*args, **kwargs)