import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface WorkflowState {
  consultationId: number | null;
  patientId: number | null;
  ordonnanceId: number | null;
  labResultId: number | null;
  radioResultId: number | null;
  currentStep: 'consultation' | 'ordonnance' | 'pharmacie' | 'caisse' | 'labo' | 'radio' | 'paiement' | 'termine';
  patientName?: string;
  patientCode?: string;
}

interface WorkflowContextType extends WorkflowState {
  setConsultationData: (data: { consultationId: number; patientId: number; patientName?: string; patientCode?: string }) => void;
  setOrdonnanceData: (ordonnanceId: number) => void;
  setLabResult: (labResultId: number) => void;
  setRadioResult: (radioResultId: number) => void;
  goToStep: (step: WorkflowState['currentStep']) => void;
  resetWorkflow: () => void;
  loadFromStorage: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [state, setState] = useState<WorkflowState>({
    consultationId: null,
    patientId: null,
    ordonnanceId: null,
    labResultId: null,
    radioResultId: null,
    currentStep: 'consultation',
  });

  // 🔍 Charger depuis localStorage au montage
  useEffect(() => {
    loadFromStorage();
  }, []);

  // 🔍 Écouter les changements de route pour synchroniser l'état
  useEffect(() => {
    const routeToStep: Record<string, WorkflowState['currentStep']> = {
      '/doctor/exam': 'consultation',
      '/doctor/ordonnance': 'ordonnance',
      '/pharmacie/dashboard': 'pharmacie',
      '/caisse': 'caisse',
      '/doctor/lab': 'labo',
      '/doctor/radio': 'radio',
      '/payement': 'paiement',
      '/patient': 'termine',
    };
    
    const step = routeToStep[location.pathname];
    if (step && step !== state.currentStep) {
      setState(prev => ({ ...prev, currentStep: step }));
    }
  }, [location.pathname]);

  const loadFromStorage = () => {
    const stored = {
      consultationId: localStorage.getItem('current_consultation_id'),
      patientId: localStorage.getItem('current_patient_id'),
      ordonnanceId: localStorage.getItem('current_ordonnance_id'),
      labResultId: localStorage.getItem('current_lab_result_id'),
      radioResultId: localStorage.getItem('current_radio_result_id'),
      currentStep: localStorage.getItem('current_workflow_step') as WorkflowState['currentStep'],
      patientName: localStorage.getItem('current_patient_name'),
      patientCode: localStorage.getItem('current_patient_code'),
    };
    
    setState(prev => ({
      ...prev,
      consultationId: stored.consultationId ? Number(stored.consultationId) : null,
      patientId: stored.patientId ? Number(stored.patientId) : null,
      ordonnanceId: stored.ordonnanceId ? Number(stored.ordonnanceId) : null,
      labResultId: stored.labResultId ? Number(stored.labResultId) : null,
      radioResultId: stored.radioResultId ? Number(stored.radioResultId) : null,
      currentStep: stored.currentStep || 'consultation',
      patientName: stored.patientName || undefined,
      patientCode: stored.patientCode || undefined,
    }));
  };

  const setConsultationData = (data: { consultationId: number; patientId: number; patientName?: string; patientCode?: string }) => {
    setState(prev => ({ ...prev, ...data }));
    localStorage.setItem('current_consultation_id', String(data.consultationId));
    localStorage.setItem('current_patient_id', String(data.patientId));
    if (data.patientName) localStorage.setItem('current_patient_name', data.patientName);
    if (data.patientCode) localStorage.setItem('current_patient_code', data.patientCode);
  };

  const setOrdonnanceData = (ordonnanceId: number) => {
    setState(prev => ({ ...prev, ordonnanceId }));
    localStorage.setItem('current_ordonnance_id', String(ordonnanceId));
  };

  const setLabResult = (labResultId: number) => {
    setState(prev => ({ ...prev, labResultId }));
    localStorage.setItem('current_lab_result_id', String(labResultId));
  };

  const setRadioResult = (radioResultId: number) => {
    setState(prev => ({ ...prev, radioResultId }));
    localStorage.setItem('current_radio_result_id', String(radioResultId));
  };

  const goToStep = (step: WorkflowState['currentStep']) => {
    setState(prev => ({ ...prev, currentStep: step }));
    localStorage.setItem('current_workflow_step', step);
  };

  const resetWorkflow = () => {
    setState({
      consultationId: null,
      patientId: null,
      ordonnanceId: null,
      labResultId: null,
      radioResultId: null,
      currentStep: 'consultation',
    });
    ['current_consultation_id', 'current_patient_id', 'current_ordonnance_id', 
     'current_lab_result_id', 'current_radio_result_id', 'current_workflow_step',
     'current_patient_name', 'current_patient_code'].forEach(k => localStorage.removeItem(k));
  };

  return (
    <WorkflowContext.Provider value={{
      ...state,
      setConsultationData,
      setOrdonnanceData,
      setLabResult,
      setRadioResult,
      goToStep,
      resetWorkflow,
      loadFromStorage,
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error('useWorkflow must be used within WorkflowProvider');
  return context;
};