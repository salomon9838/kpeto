// components/index.ts
// Facilite les imports en permettant : import { LoginForm, RegisterForm } from './components'

// Auth Components
export { default as LoginForm } from './Auth/LoginForm';
export { default as RegisterForm } from './Auth/RegisterForm';

// Dashboard Components
export { default as Header } from './Dashboard/Header';
export { default as NavTabs } from './Dashboard/NavTabs';
export { default as CarnetSection } from './Dashboard/CarnetSection';
export { default as PaymentSection } from './Dashboard/PaymentSection';
export { default as SettingsSection } from './Dashboard/SettingsSection';

// Settings Components
export { default as ProfileSettings } from './Settings/ProfileSettings';
export { default as FamilySettings } from './Settings/FamilySettings';
export { default as SecuritySettings } from './Settings/SecuritySettings';

// Modals
export { default as CarnetModal } from './Modals/CarnetModal';
export { default as PaymentModal } from './Modals/PaymentModal';
export { default as ProfileModal } from './Modals/ProfileModal';
export { default as FamilyMemberModal } from './Modals/FamilyMemberModal';
export { default as HelpModal } from './Modals/HelpModal';

// Common Components
export { default as Modal } from './Common/Modal';
export { default as GlobalStyles } from './Common/GlobalStyles';
