export const getSessionContext = () => ({
  patientId: localStorage.getItem('current_patient_id'),
  doctorId: localStorage.getItem('current_doctor_id'),
  service: localStorage.getItem('current_service'),
  isAuthenticated: !!localStorage.getItem('access_token'),
});

export const clearSessionContext = () => {
  localStorage.removeItem('current_patient_id');
  localStorage.removeItem('current_doctor_id');
  localStorage.removeItem('current_service');
  localStorage.removeItem('session_started_at');
};

export const requirePatientId = (navigate: any) => {
  const pid = localStorage.getItem('current_patient_id');
  if (!pid) {
    navigate('/old-consultation');
    return null;
  }
  return pid;
};