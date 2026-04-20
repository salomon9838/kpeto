import { Step } from "../App";

interface Props {
  active: Step;
  onChange: (step: Step) => void;
}

export default function NavTabs({ active, onChange }: Props) {
  // Fonction utilitaire pour générer les onglets proprement
  const tab = (id: Step, label: string) => (
    <div
      className={`sub-nav-item ${active === id ? "active" : ""}`}
      onClick={() => onChange(id)}
    >
      {label}
    </div>
  );

  return (
    <nav className="consult-nav">
      {/* 1. La consultation physique (image_a3040b.png) */}
      {tab("exam", "👁️ Consultation Ophtalmo")}

      {/* 2. L'ordonnance de médicaments (image_a368e9.png) */}
      {tab("ortho", "💊 Ordonnance Médicale")}

      {/* 3. NOUVEAU : Tes analyses spécialisées (PIO, Pachymétrie, etc.) */}
      {tab("ophtalmo_lab", "🔬 Analyse Ophtalmo")}

      {/* 4. Les analyses de sang/biochimie (image_a36d68.png) */}
      {tab("lab", "🧪 Analyses Laboratoire")}

      {/* 5. L'imagerie médicale (image_a378c9.png) */}
      {tab("radio", "📋 Analyse Radio")}
    </nav>
  );
}