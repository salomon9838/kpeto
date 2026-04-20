function NavTabs({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  return (
    <nav className="consult-nav">
      <div className={`sub-nav-item ${activeTab === "exam" ? "active" : ""}`}
        onClick={() => setActiveTab("exam")}>
        📋 Examen Clinique
      </div>

      <div className={`sub-nav-item ${activeTab === "ordonnance" ? "active" : ""}`}
        onClick={() => setActiveTab("ordonnance")}>
        💊 Ordonnance Médicale
      </div>
{/* 
      <div className={`sub-nav-item ${activeTab === "lab" ? "active" : ""}`}
        onClick={() => setActiveTab("lab")}>
        🔬 Analyses Laboratoire
      </div> */}

      <div className={`sub-nav-item ${activeTab === "radio" ? "active" : ""}`}
        onClick={() => setActiveTab("radio")}>
        🖥 Analyse Radio
      </div>
    </nav>
  );
}

export default NavTabs;
