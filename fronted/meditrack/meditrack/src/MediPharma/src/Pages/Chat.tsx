import React, { useState, useEffect, useRef } from "react";
import { Send, Search, Phone, MoreVertical, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "pharmacist" | "customer";
  timestamp: string;
}

interface Conversation {
  id: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  unreadCount: number;
  online?: boolean;
}

const Chat = () => {
  const [conversations] = useState<Conversation[]>([
    {
      id: "1",
      customerName: "Marie Dupont",
      customerPhone: "+228 90 12 34 56",
      lastMessage: "Merci pour votre aide !",
      unreadCount: 2,
      online: true,
    },
    {
      id: "2",
      customerName: "Jean Kofi",
      customerPhone: "+228 91 23 45 67",
      lastMessage: "Est-ce que vous avez du Doliprane ?",
      unreadCount: 1,
      online: false,
    },
    {
      id: "3",
      customerName: "Afi Mensah",
      customerPhone: "+228 92 34 56 78",
      lastMessage: "D'accord, je passe demain",
      unreadCount: 0,
      online: true,
    },
  ]);

  const [selectedConv, setSelectedConv] = useState<Conversation | null>(conversations[0]);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Bonjour, je voudrais savoir si vous avez du Doliprane 1000mg ?", sender: "customer", timestamp: "10:30" },
    { id: "2", text: "Bonjour Marie ! Oui nous en avons en stock. Combien en avez-vous besoin ?", sender: "pharmacist", timestamp: "10:32" },
    { id: "3", text: "J'en voudrais 2 boîtes s'il vous plaît", sender: "customer", timestamp: "10:33" },
    { id: "4", text: "Parfait ! Je vous les prépare. Vous pouvez passer les récupérer quand vous voulez.", sender: "pharmacist", timestamp: "10:35" },
    { id: "5", text: "Merci pour votre aide !", sender: "customer", timestamp: "10:36" },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers le bas lors d'un nouveau message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "pharmacist",
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Styles Inline pour garantir le rendu professionnel
  const chatCardStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    border: "1px solid #eef2f1"
  };

  return (
    <div style={{ 
      padding: "20px", 
      height: "calc(100vh - 40px)", 
      fontFamily: "Inter, system-ui, sans-serif",
      backgroundColor: "#f8fafc"
    }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
          <MessageSquare size={32} color="#00a896" /> Messages
        </h1>
        <p style={{ color: "#64748b", marginTop: "4px" }}>Gestion des échanges avec la patientèle</p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "350px 1fr",
        gap: "20px",
        height: "calc(100% - 100px)",
      }}>
        
        {/* LISTE DES CONVERSATIONS */}
        <div style={chatCardStyle}>
          <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 40px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  outline: "none",
                  fontSize: "14px"
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: selectedConv?.id === conv.id ? "#e6f7f4" : "transparent",
                  cursor: "pointer",
                  marginBottom: "8px",
                  transition: "0.2s",
                  borderLeft: selectedConv?.id === conv.id ? "4px solid #00a896" : "4px solid transparent"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>{conv.customerName}</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>10:36</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <p style={{ 
                    fontSize: "13px", 
                    color: "#64748b", 
                    margin: 0, 
                    whiteSpace: "nowrap", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis",
                    maxWidth: "200px"
                  }}>
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span style={{ background: "#ef4444", color: "white", fontSize: "10px", padding: "2px 6px", borderRadius: "10px", fontWeight: "bold" }}>
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ZONE DE MESSAGERIE */}
        <div style={chatCardStyle}>
          {selectedConv ? (
            <>
              {/* Entête du chat */}
              <div style={{ padding: "15px 25px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#00a896", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                    {selectedConv.customerName[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: "700", color: "#1e293b" }}>{selectedConv.customerName}</div>
                    <div style={{ fontSize: "12px", color: "#00a896", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#00a896" }}></span> En ligne
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button style={{ background: "none", border: "1px solid #e2e8f0", padding: "8px", borderRadius: "8px", cursor: "pointer", color: "#64748b" }}>
                    <Phone size={18} />
                  </button>
                  <button style={{ background: "none", border: "1px solid #e2e8f0", padding: "8px", borderRadius: "8px", cursor: "pointer", color: "#64748b" }}>
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Conteneur des Messages */}
              <div 
                ref={scrollRef}
                style={{ flex: 1, overflowY: "auto", padding: "25px", display: "flex", flexDirection: "column", gap: "15px", backgroundColor: "#fdfdfd" }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: msg.sender === "pharmacist" ? "flex-end" : "flex-start",
                      maxWidth: "70%",
                    }}
                  >
                    <div style={{
                      backgroundColor: msg.sender === "pharmacist" ? "#00a896" : "#f1f5f9",
                      color: msg.sender === "pharmacist" ? "#fff" : "#1e293b",
                      padding: "12px 16px",
                      borderRadius: msg.sender === "pharmacist" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.03)"
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "5px", textAlign: msg.sender === "pharmacist" ? "right" : "left" }}>
                      {msg.timestamp}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input de Message */}
              <div style={{ padding: "20px", borderTop: "1px solid #f1f5f9", backgroundColor: "#fff" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Écrivez votre message ici..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                      flex: 1,
                      padding: "12px 18px",
                      borderRadius: "25px",
                      border: "1px solid #e2e8f0",
                      outline: "none",
                      fontSize: "14px",
                      backgroundColor: "#f8fafc"
                    }}
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!inputMessage.trim()}
                    style={{
                      width: "45px",
                      height: "45px",
                      borderRadius: "50%",
                      backgroundColor: inputMessage.trim() ? "#00a896" : "#cbd5e1",
                      color: "#fff",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: inputMessage.trim() ? "pointer" : "default",
                      transition: "0.3s"
                    }}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              <MessageSquare size={64} style={{ marginBottom: "16px", opacity: 0.2 }} />
              <p>Sélectionnez un patient pour démarrer la discussion</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;