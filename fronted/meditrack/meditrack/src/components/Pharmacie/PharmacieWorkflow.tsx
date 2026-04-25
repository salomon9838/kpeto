import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkflow } from '../../context/WorkflowContext';
import { useNotifications } from '../../context/NotificationContext';
import { Package, AlertTriangle, CheckCircle, Loader2, MessageSquare } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  stock_available: number;
  prescription_id: number;
}

export default function PharmacieWorkflow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { consultationId, patientId, ordonnanceId, patientName, goToStep } = useWorkflow();
  const { addNotification } = useNotifications();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [sendingToCaisse, setSendingToCaisse] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<{productId: number; productName: string; required: number; available: number}[]>([]);

  useEffect(() => {
    if (!consultationId || !patientId || !ordonnanceId) {
      addNotification({
        type: 'error',
        title: 'Données manquantes',
        message: 'Impossible de charger l\'ordonnance. Veuillez recommencer.',
        scope: 'pharmacie'
      });
      navigate('/old-consultation');
      return;
    }
    
    fetchPrescriptionProducts();
  }, [consultationId, patientId, ordonnanceId]);

  const fetchPrescriptionProducts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/ordonnances/${ordonnanceId}/products/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data: Product[] = await response.json();
      setProducts(data);
      
      // Vérifier les stocks
      const alerts = data.filter(p => p.quantity > p.stock_available).map(p => ({
        productId: p.id,
        productName: p.name,
        required: p.quantity,
        available: p.stock_available
      }));
      
      if (alerts.length > 0) {
        setStockAlerts(alerts);
        // 🔔 Alerter le médecin
        alerts.forEach(alert => {
          addNotification({
            type: 'warning',
            title: 'Stock insuffisant',
            message: `Produit "${alert.productName}" : ${alert.available}/${alert.required} disponibles`,
            scope: 'doctor',
            data: { prescriptionId: ordonnanceId, patientId, patientName, productId: alert.productId }
          });
        });
      }
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      addNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de récupérer les produits de l\'ordonnance.',
        scope: 'pharmacie'
      });
    } finally {
      setLoading(false);
    }
  };

  const prepareProducts = async () => {
    setPreparing(true);
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:8000/api/pharmacie/prepare/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          ordonnance_id: ordonnanceId,
          products: products.map(p => ({ id: p.id, quantity: p.quantity }))
        })
      });
      
      addNotification({
        type: 'success',
        title: 'Préparation terminée',
        message: 'Produits prêts pour la caisse.',
        scope: 'pharmacie'
      });
    } catch (err) {
      console.error('Erreur préparation:', err);
      addNotification({
        type: 'error',
        title: 'Échec préparation',
        message: 'Erreur lors de la préparation des produits.',
        scope: 'pharmacie'
      });
    } finally {
      setPreparing(false);
    }
  };

  const sendToCaisse = async () => {
    setSendingToCaisse(true);
    try {
      const token = localStorage.getItem('access_token');
      const total = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      
      const response = await fetch('http://localhost:8000/api/pharmacie/send-to-caisse/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          ordonnance_id: ordonnanceId,
          consultation_id: consultationId,
          patient_id: patientId,
          patient_name: patientName,
          products: products.map(p => ({ id: p.id, name: p.name, quantity: p.quantity, price: p.price })),
          total_amount: total,
          stock_alerts: stockAlerts
        })
      });
      
      if (!response.ok) throw new Error('Failed to send to caisse');
      
      goToStep('caisse');
      navigate('/caisse', {
        state: {
          consultationId,
          patientId,
          ordonnanceId,
          patientName,
          products,
          total,
          stockAlerts
        }
      });
      
    } catch (err) {
      console.error('Erreur envoi caisse:', err);
      addNotification({
        type: 'error',
        title: 'Échec d\'envoi',
        message: 'Impossible d\'envoyer à la caisse.',
        scope: 'pharmacie'
      });
    } finally {
      setSendingToCaisse(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /> Chargement...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="text-teal-600" /> Pharmacie
        </h2>
        <div className="text-sm text-gray-500">
          Patient: <span className="font-medium">{patientName}</span> • ID: {patientId}
        </div>
      </div>

      {/* Alertes stock */}
      {stockAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 mt-1" size={20} />
            <div>
              <h4 className="font-semibold text-amber-800">⚠️ Produits en stock limité</h4>
              <ul className="mt-2 space-y-1">
                {stockAlerts.map(alert => (
                  <li key={alert.productId} className="text-sm text-amber-700">
                    • {alert.productName}: {alert.available}/{alert.required} disponibles
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-amber-600">
                Le médecin a été notifié pour ajuster la prescription si nécessaire.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Liste produits */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Produits à préparer</h3>
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun produit dans cette ordonnance.</p>
        ) : (
          <div className="space-y-3">
            {products.map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    Quantité: {product.quantity} • {product.price} FCFA/unité
                  </div>
                </div>
                <div className={`text-sm font-medium ${product.stock_available >= product.quantity ? 'text-green-600' : 'text-amber-600'}`}>
                  Stock: {product.stock_available}
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">Total:</span>
                <span className="text-xl font-bold text-teal-600">
                  {products.reduce((sum, p) => sum + (p.price * p.quantity), 0)} FCFA
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={prepareProducts}
          disabled={preparing || products.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {preparing ? <Loader2 className="animate-spin" /> : <CheckCircle />}
          {preparing ? 'Préparation...' : '📦 Préparer les produits'}
        </button>
        
        <button
          onClick={sendToCaisse}
          disabled={sendingToCaisse || products.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {sendingToCaisse ? <Loader2 className="animate-spin" /> : '💰'}
          {sendingToCaisse ? 'Envoi...' : 'Envoyer à la caisse'}
        </button>
      </div>
    </div>
  );
}