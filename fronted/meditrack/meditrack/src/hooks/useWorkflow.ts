import { useState, useEffect } from 'react';

export interface WorkflowData {
  consultationId: number | null;
  patientId: number | null;
  ordonnanceId: number | null;
  currentStep: string;
}

export const useWorkflow = () => {
  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    consultationId: null,
    patientId: null,
    ordonnanceId: null,
    currentStep: 'consultation',
  });

  // Charger depuis localStorage au montage
  useEffect(() => {
    const data: WorkflowData = {
      consultationId: Number(localStorage.getItem('current_consultation_id')) || null,
      patientId: Number(localStorage.getItem('current_patient_id')) || null,
      ordonnanceId: Number(localStorage.getItem('current_ordonnance_id')) || null,
      currentStep: localStorage.getItem('current_workflow_step') || 'consultation',
    };
    setWorkflowData(data);
  }, []);

  const setConsultationData = (consultationId: number, patientId: number) => {
    localStorage.setItem('current_consultation_id', String(consultationId));
    localStorage.setItem('current_patient_id', String(patientId));
    localStorage.setItem('current_workflow_step', 'ordonnance');
    
    setWorkflowData(prev => ({
      ...prev,
      consultationId,
      patientId,
      currentStep: 'ordonnance',
    }));
  };

  const setOrdonnanceData = (ordonnanceId: number) => {
    localStorage.setItem('current_ordonnance_id', String(ordonnanceId));
    localStorage.setItem('current_workflow_step', 'pharmacie');
    
    setWorkflowData(prev => ({
      ...prev,
      ordonnanceId,
      currentStep: 'pharmacie',
    }));
  };

  const goToStep = (step: string) => {
    localStorage.setItem('current_workflow_step', step);
    setWorkflowData(prev => ({ ...prev, currentStep: step }));
  };

  const resetWorkflow = () => {
    localStorage.removeItem('current_consultation_id');
    localStorage.removeItem('current_patient_id');
    localStorage.removeItem('current_ordonnance_id');
    localStorage.removeItem('current_workflow_step');
    
    setWorkflowData({
      consultationId: null,
      patientId: null,
      ordonnanceId: null,
      currentStep: 'consultation',
    });
  };

  return {
    ...workflowData,
    setConsultationData,
    setOrdonnanceData,
    goToStep,
    resetWorkflow,
  };
};