// components/Dashboard/NavTabs.tsx
import React from 'react';
import { MainTab } from '../../types';

interface NavTabsProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onHelpClick: () => void;
  onLogout: () => void;
}

const NavTabs: React.FC<NavTabsProps> = ({ activeTab, onTabChange, onHelpClick, onLogout }) => {
  return (
    <div className="nav-tabs">
      <div 
        className={`nav-tab ${activeTab === 'carnet' ? 'active' : ''}`} 
        onClick={() => onTabChange('carnet')}
      >
        📋 Carnet Numérique
      </div>
      <div 
        className={`nav-tab ${activeTab === 'paiement' ? 'active' : ''}`} 
        onClick={() => onTabChange('paiement')}
      >
        💳 Paiement
      </div>
      <div 
        className={`nav-tab ${activeTab === 'parametres' ? 'active' : ''}`} 
        onClick={() => onTabChange('parametres')}
      >
        ⚙️ Paramètres
      </div>
      
    </div>
  );
};

export default NavTabs;
