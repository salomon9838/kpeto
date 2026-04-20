import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Home, 
  ShoppingBag, 
  Package,  
  MessageSquare, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { 
      id: "dashboard",
      icon: Home, 
      label: "Dashboard", 
      path: "/" 
    },
    { 
      id: "orders",
      icon: ShoppingBag, 
      label: "Commandes", 
      path: "/orders" 
    },
    { 
      id: "inventory",
      icon: Package, 
      label: "Inventaire", 
      path: "/inventory" 
    },
    { 
      id: "chat",
      icon: MessageSquare, 
      label: "Messages", 
      path: "/chat",
      badge: 2
    },
    { 
      id: "settings",
      icon: Settings, 
      label: "Paramètres", 
      path: "/settings" 
    },
  ];

  return (
    <aside style={{
      width: isCollapsed ? "80px" : "260px",
      height: "100vh",
      background: "var(--mp-bg-sidebar)",
      position: "fixed",
      left: 0,
      top: 0,
      display: "flex",
      flexDirection: "column",
      padding: "1.5rem 0",
      transition: "width 0.3s ease",
      zIndex: 1000,
    }}>
      
      {/* ==================== LOGO MEDIPHARMA ==================== */}
      <div style={{ 
        padding: isCollapsed ? "0 1rem" : "0 1.5rem", 
        marginBottom: "2rem",
        transition: "padding 0.3s ease",
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.75rem",
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}>
          <div style={{
            width: "44px",
            height: "44px",
            background: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "1.1rem",
            fontWeight: 700,
            letterSpacing: "1px",
            boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
            flexShrink: 0,
          }}>
            MP
          </div>
          
          {!isCollapsed && (
            <div style={{ 
              opacity: isCollapsed ? 0 : 1,
              transition: "opacity 0.2s ease",
            }}>
              <div style={{ 
                color: "white", 
                fontWeight: 700, 
                fontSize: "1.2rem",
                letterSpacing: "0.5px",
              }}>
                MediPharma
              </div>
              <div style={{ 
                color: "#94A3B8", 
                fontSize: "0.75rem",
                fontWeight: 500,
              }}>
                Dashboard Pro
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== NAVIGATION ==================== */}
      <nav style={{ 
        flex: 1, 
        padding: isCollapsed ? "0 0.5rem" : "0 1rem",
        overflowY: "auto",
        overflowX: "hidden",
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                gap: "0.75rem",
                padding: isCollapsed ? "0.875rem 0.5rem" : "0.875rem 1rem",
                borderRadius: "10px",
                textDecoration: "none",
                color: isActive ? "white" : "#94A3B8",
                background: isActive ? "var(--mp-blue-primary)" : "transparent",
                marginBottom: "0.375rem",
                transition: "all 0.2s ease",
                fontWeight: 500,
                cursor: "pointer",
                position: "relative",
              })}
              onMouseEnter={(e) => {
                const target = e.currentTarget;
                const isActive = target.getAttribute('aria-current') === 'page';
                if (!isActive) {
                  target.style.background = "rgba(255,255,255,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget;
                const isActive = target.getAttribute('aria-current') === 'page';
                if (!isActive) {
                  target.style.background = "transparent";
                }
              }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              
              {!isCollapsed && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  
                  {item.badge && (
                    <span style={{
                      background: "#EF4444",
                      color: "white",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "10px",
                      minWidth: "20px",
                      textAlign: "center",
                    }}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              
              {isCollapsed && item.badge && (
                <div style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "8px",
                  height: "8px",
                  background: "#EF4444",
                  borderRadius: "50%",
                  border: "2px solid var(--mp-bg-sidebar)",
                }} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ==================== BOUTON COLLAPSE/EXPAND ==================== */}
      <div style={{
        padding: isCollapsed ? "0 0.5rem" : "0 1rem",
        marginBottom: "1rem",
      }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#94A3B8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontWeight: 500,
            fontSize: "0.875rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "#94A3B8";
          }}
        >
          {isCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} />
              <span>Réduire</span>
            </>
          )}
        </button>
      </div>

      {/* ==================== PROFIL UTILISATEUR ==================== */}
      <div style={{
        padding: isCollapsed ? "0 0.5rem" : "0 1.5rem",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        paddingTop: "1rem",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "0.75rem",
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            color: "white",
            fontSize: "0.9rem",
            flexShrink: 0,
          }}>
            PK
          </div>
          
          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: "0.9rem", 
                fontWeight: 600, 
                color: "white",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                Pharmacien Kodjo
              </div>
              <div style={{ 
                fontSize: "0.75rem", 
                color: "#94A3B8",
              }}>
                En ligne
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;