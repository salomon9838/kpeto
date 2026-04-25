import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkflow } from '../../context/WorkflowContext';
import { useNotifications } from '../../context/NotificationContext';
import { CreditCard, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import PaymentModal from '../Modals/PaymentModal';

interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface StockAlert {
  productId: number;
  productName: string;
  required: number;
  available: number;
}

export default function CaisseWorkflow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { consultationId, patientId, ordonnanceId, patientName, goToStep, resetWorkflow } = useWorkflow();
  const { addNotification } = useNotifications();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [processing, setProcessing] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const state = location.state;
    if (state?.products && state?.total !== undefined) {
      setProducts(state.products);
      setTotal(state.total);
      if (state.stockAlerts) setStockAlerts(state.stockAlerts);
    } else if (consultationId && patientId) {
      // Fallback: re-fetch from API
      fetchCaisseData();
    } else {
      addNotification({
        type: 'error',
        title: 'Données manquantes',
        message: 'Impossible de charger les informations de paiement.',
        scope: 'caisse'
      });
      navigate('/old-consultation');
    }
  }, [location.state, consultationId, patientId]);

  const fetchCaisseData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/caisse/${ordonnanceId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch caisse data');
      
      const data = await response.json();
      setProducts(data.products);
      setTotal(data.total_amount);
      if (data.stock_alerts) setStockAlerts(data.stock_alerts);
    } catch (err) {
      console.error('Erreur chargement caisse:', err);
      addNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de récupérer les données de paiement.',
        scope: 'caisse'
      });
    }
  };

  const handlePaymentSubmit = async (paymentData: any) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // 1️⃣ Enregistrer le paiement
      const paymentResponse = await fetch('http://localhost:8000/api/paiements/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          consultation: consultationId,
          ordonnance: ordonnanceId,
          patient: patientId,
          amount: total,
          payment_method: paymentData.methode,
          phone_number: paymentData.telephone,
          centre: paymentData.centre,
          service: paymentData.service,
          type: paymentData.type,
        })
      });
      
      if (!paymentResponse.ok) {
        const err = await paymentResponse.json();
        throw new Error(err.error || 'Échec du paiement');
      }
      
      const payment = await paymentResponse.json();
      
      // 2️⃣ Mettre à jour le statut de l'ordonnance
      await fetch(`http://localhost:8000/api/ordonnances/${ordonnanceId}/mark-paid/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ payment_id: payment.id })
      });
      
      // 3️⃣ Générer la facture
      const invoiceResponse = await fetch('http://localhost:8000/api/factures/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          payment_id: payment.id,
          patient_id: patientId,
          products: products,
          total: total
        })
      });
      
      const invoice = await invoiceResponse.json();
      
      // 4️⃣ Notifier la pharmacie (délivrance)
      addNotification({
        type: 'success',
        title: 'Paiement validé',
        message: `Paiement de ${total} FCFA reçu pour ${patientName}`,
        scope: 'pharmacie',
        data: { ordonnanceId, patientId, invoiceId: invoice.id }
      });
      
      // 5️⃣ Notifier le médecin
      addNotification({
        type: 'info',
        title: 'Consultation finalisée',
        message: `Paiement effectué pour ${patientName} - Ordonnance #${ordonnanceId}`,
        scope: 'doctor',
        data: { ordonnanceId, patientId, paymentId: payment.id }
      });
      
      setPaymentSuccess(true);
      
      // 6️⃣ Rediriger après délai
      setTimeout(() => {
        resetWorkflow();
        navigate('/patient', {
          state: {
            message: 'Consultation terminée et payée',
            invoiceId: invoice.id
          }
        });
      }, 3000);
      
    } catch (err: any) {
      console.error('Erreur paiement:', err);
      addNotification({
        type: 'error',
        title: 'Échec du paiement',
        message: err.message || 'Une erreur est survenue lors du paiement.',
        scope: 'caisse'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSendToLabo = () => {
    goToStep('labo');
    navigate('/doctor/lab', {
      state: { consultationId, patientId, ordonnanceId }
    });
  };

  if (paymentSuccess) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-800 mb-2">✅ Paiement validé !</h3>
          <p className="text-green-700 mb-4">
            Facture générée et envoyée au patient.<br/>
            La pharmacie a été notifiée pour la délivrance.
          </p>
          <p className="text-sm text-green-600">Redirection dans 3 secondes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="text-blue-600" /> Caisse
        </h2>
        <div className="text-sm text-gray-500">
          Patient: <span className="font-medium">{patientName}</span> • ID: {patientId}
        </div>
      </div>

      {/* Alertes stock */}
      {stockAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-1" size={20} />
            <div>
              <h4 className="font-semibold text-amber-800">⚠️ Attention : Stock limité</h4>
              <p className="text-sm text-amber-700 mt-1">
                Certains produits sont en quantité limitée. La délivrance pourra être partielle.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Récapitulatif */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Récapitulatif du paiement</h3>
        <div className="space-y-3">
          {products.map(product => (
            <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">{product.name}</div>
                <div className="text-sm text-gray-500">x{product.quantity}</div>
              </div>
              <div className="font-medium text-gray-800">{(product.price * product.quantity).toLocaleString()} FCFA</div>
            </div>
          ))}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">Total à payer:</span>
              <span className="text-2xl font-bold text-blue-600">{total.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => setPaymentModalOpen(true)}
          disabled={processing || total === 0}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {processing ? <Loader2 className="animate-spin" /> : <CreditCard />}
          {processing ? 'Traitement...' : '💳 Payer maintenant'}
        </button>
        
        <button
          onClick={handleSendToLabo}
          className="px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition"
        >
          🔬 Analyses
        </button>
      </div>

      {/* Modal de paiement */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        isInline={false}
      />
    </div>
  );
}