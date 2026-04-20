import { NavigateFunction } from 'react-router-dom';

export interface FlowStep {
  route: string;
  label: string;
}

export const medicalFlows: Record<string, FlowStep[]> = {
  ophtalmo: [
    { route: '/ophtalmo/consultation', label: 'Consultation' },
    { route: '/ophtalmo/ordonnance', label: 'Ordonnance' },
    { route: '/ophtalmo/analyse-ophtalmo', label: 'Analyse' },
    { route: '/ophtalmo/labo', label: 'Labo' },
    { route: '/ophtalmo/radio', label: 'Radio' },
    { route: '/payement', label: 'Paiement' },
  ],
  chirurgie: [
    { route: '/chirurgie/consultation', label: 'Consultation' },
    { route: '/chirurgie/ordonnance', label: 'Ordonnance' },
    { route: '/chirurgie/labo', label: 'Labo' },
    { route: '/chirurgie/radio', label: 'Radio' },
    { route: '/payement', label: 'Paiement' },
  ],
  urologie: [
    { route: '/urologie/consultation', label: 'Consultation' },
    { route: '/urologie/ordonnance', label: 'Ordonnance' },
    { route: '/urologie/labo', label: 'Labo' },
    { route: '/urologie/radio', label: 'Radio' },
    { route: '/payement', label: 'Paiement' },
  ],
  cardiologie: [
    { route: '/cardiologie/examen', label: 'Examen' },
    { route: '/cardiologie/ordonnance', label: 'Ordonnance' },
    { route: '/cardiologie/radio', label: 'Radio' },
    { route: '/payement', label: 'Paiement' },
  ],
  general: [
    { route: '/doctor/exam', label: 'Examen' },
    { route: '/doctor/ordonnance', label: 'Ordonnance' },
    { route: '/doctor/lab', label: 'Labo' },
    { route: '/doctor/radio', label: 'Radio' },
    { route: '/payement', label: 'Paiement' },
  ],
};

/**
 * 🚀 Navigue automatiquement à l'étape suivante après succès API
 */
export const goToNextStep = (
  navigate: NavigateFunction,
  currentRoute: string,
  specialty: string,
  consultationId: number | null,
  delay: number = 1500
) => {
  const flow = medicalFlows[specialty];
  if (!flow) {
    console.error(`Flow introuvable pour: ${specialty}`);
    return;
  }

  const currentIndex = flow.findIndex(s => s.route === currentRoute);
  if (currentIndex === -1 || currentIndex >= flow.length - 1) {
    console.warn('Déjà à la dernière étape ou route non trouvée');
    return;
  }

  const nextStep = flow[currentIndex + 1];
  if (consultationId) {
    localStorage.setItem('current_consultation_id', consultationId.toString());
  }

  setTimeout(() => {
    navigate(nextStep.route, {
      state: {
        consultationId: consultationId || localStorage.getItem('current_consultation_id'),
        from: flow[currentIndex].route,
        stepIndex: currentIndex + 1,
      }
    });
  }, delay);
};

/**
 * 🔍 Récupère l'index de l'étape actuelle
 */
export const getCurrentStepIndex = (currentRoute: string, specialty: string): number => {
  const flow = medicalFlows[specialty];
  return flow ? flow.findIndex(s => s.route === currentRoute) : -1;
};

/**
 * 🔒 Vérifie et sécurise l'ID de consultation
 */
export const requireConsultationId = (navigate: NavigateFunction, specialty: string): number | null => {
  const id = localStorage.getItem('current_consultation_id');
  if (!id) {
    const flow = medicalFlows[specialty];
    if (flow) {
      navigate(flow[0].route, { replace: true });
    }
    return null;
  }
  return parseInt(id, 10);
};

/**
 * 💾 Sauvegarde l'ID de consultation en cours
 */
export const saveConsultationId = (id: number) => {
  localStorage.setItem('current_consultation_id', id.toString());
};

/**
 * 🗑️ Efface l'ID de consultation (fin du parcours)
 */
export const clearConsultationId = () => {
  localStorage.removeItem('current_consultation_id');
};

/**
 * 📊 Obtient le nom de la spécialité depuis une route
 */
export const getSpecialtyFromRoute = (route: string): string | null => {
  for (const [specialty, flow] of Object.entries(medicalFlows)) {
    if (flow.some(s => s.route === route)) {
      return specialty;
    }
  }
  return null;
};