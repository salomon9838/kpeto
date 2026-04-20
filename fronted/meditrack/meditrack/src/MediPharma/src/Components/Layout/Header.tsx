import { useState } from "react";
import { Search, Bell, User, Menu, FileText, Pill, Monitor } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Vérifie si on est dans la partie docteur
  const isDoctorSection =
    location.pathname.startsWith("/doctor/exam") ||
    location.pathname.startsWith("/doctor/ordonnance") ||
    location.pathname.startsWith("/doctor/radio");

  const doctorMenuItems = [
    {
      label: "Examen Clinique",
      icon: FileText,
      path: "/doctor/exam",
    },
    {
      label: "Ordonnance Médicale",
      icon: Pill,
      path: "/doctor/ordonnance",
    },
    {
      label: "Analyse Radio",
      icon: Monitor,
      path: "/doctor/radio",
    },
  ];

  return (
    <>
      <header
        style={{
          height: "70px",
          background: "var(--mp-bg-card)",
          borderBottom: "1px solid var(--mp-border)",
          display: "flex",
          alignItems: "center",
          padding: "0 2rem",
          gap: "1.5rem",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* Bouton menu mobile */}
        <button
          onClick={onMenuClick}
          className="mobile-menu-btn"
          style={{
            display: "none",
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            border: "1px solid var(--mp-border)",
            background: "transparent",
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Menu size={20} color="var(--mp-text-secondary)" />
        </button>

        {/* Barre de recherche */}
        <div
          style={{
            flex: 1,
            maxWidth: "600px",
            position: "relative",
          }}
        >
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: isFocused ? "var(--mp-blue-primary)" : "var(--mp-text-secondary)",
              transition: "color 0.2s ease",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Rechercher médicament, commande, patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 3rem",
              border: `1px solid ${
                isFocused ? "var(--mp-blue-primary)" : "var(--mp-border)"
              }`,
              borderRadius: "10px",
              fontSize: "0.9rem",
              outline: "none",
              transition: "all 0.2s ease",
              background: "var(--mp-bg-main)",
              color: "var(--mp-text-primary)",
              fontFamily: "Outfit, sans-serif",
              boxShadow: isFocused ? "0 0 0 3px rgba(2, 132, 199, 0.1)" : "none",
            }}
          />

          {searchQuery && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 0.5rem)",
                left: 0,
                right: 0,
                background: "white",
                borderRadius: "10px",
                boxShadow: "var(--mp-shadow-lg)",
                border: "1px solid var(--mp-border)",
                padding: "0.5rem",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  padding: "0.75rem",
                  color: "var(--mp-text-secondary)",
                  fontSize: "0.875rem",
                  textAlign: "center",
                }}
              >
                Recherche : "{searchQuery}"
                <br />
                <span style={{ fontSize: "0.75rem" }}>
                  (Fonctionnalité à implémenter)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Partie droite */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          {/* Notifications */}
          <button
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              border: "1px solid var(--mp-border)",
              background: "var(--mp-bg-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.borderColor = "var(--mp-blue-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--mp-bg-main)";
              e.currentTarget.style.borderColor = "var(--mp-border)";
            }}
            title="Notifications"
          >
            <Bell size={18} color="var(--mp-text-secondary)" />
            <span
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                width: "8px",
                height: "8px",
                background: "var(--mp-error)",
                borderRadius: "50%",
                border: "2px solid white",
              }}
            />
          </button>

          {/* Profil */}
          <button
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "white",
              border: "none",
              boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
              transition: "all 0.2s ease",
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(2, 132, 199, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(2, 132, 199, 0.3)";
            }}
            title="Profil"
          >
            <User size={18} />
          </button>

          {/* Statut */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: "var(--mp-success-light)",
              borderRadius: "20px",
              border: "1px solid #A7F3D0",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                background: "var(--mp-success)",
                borderRadius: "50%",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--mp-success-dark)",
              }}
            >
              En ligne
            </span>
          </div>
        </div>
      </header>

      {/* ================= MENU DOCTEUR / ORDONNANCE ================= */}
      {isDoctorSection && (
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            padding: "1rem 2rem",
            background: "white",
            borderBottom: "1px solid var(--mp-border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            position: "sticky",
            top: "70px",
            zIndex: 99,
          }}
        >
          {doctorMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.85rem 1.2rem",
                  borderRadius: "12px",
                  border: isActive ? "1px solid #0284C7" : "1px solid #E5E7EB",
                  background: isActive ? "#E0F2FE" : "white",
                  color: isActive ? "#0284C7" : "#334155",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "0.25s ease",
                  boxShadow: isActive
                    ? "0 4px 12px rgba(2,132,199,0.12)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#F8FAFC";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.9);
          }
        }

        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
};

export default Header;