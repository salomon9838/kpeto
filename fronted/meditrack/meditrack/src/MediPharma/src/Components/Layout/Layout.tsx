import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      
      <Sidebar />

      <div style={{
        marginLeft: "260px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "calc(100% - 260px)",
        transition: "margin-left 0.3s ease, width 0.3s ease",
      }}>
        
        <Header />

        <main style={{
          flex: 1,
          padding: "2rem",
          background: "var(--mp-bg-main)",
          overflowY: "auto",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;