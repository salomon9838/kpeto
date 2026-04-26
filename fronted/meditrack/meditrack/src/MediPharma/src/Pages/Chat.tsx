import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Send, 
  Search, 
  Phone, 
  MoreVertical, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X,
  Clock,
  User,
  Users,
  Check,
  CheckCheck,
  Paperclip,
  Smile,
  Image as ImageIcon
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================
type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  message: string;
  details?: string[];
}

interface Message {
  id: string;
  text: string;
  sender: 'pharmacist' | 'customer' | 'doctor' | 'admin';
  senderName: string;
  timestamp: string;
  read: boolean;
  consultationId?: number;
  patientId?: number;
  attachments?: string[];
}

interface Conversation {
  id: string;
  title: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  unreadCount: number;
  online?: boolean;
  lastMessageTime?: string;
  consultationId?: number;
  patientId?: number;
  participants?: Array<{ id: number; name: string; role: string; avatar?: string }>;
  isGroup?: boolean;
  specialty?: string;
}

// =============================================================================
// API UTILS
// =============================================================================
const API_BASE = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json',
  };
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      ...options,
      headers: { ...getAuthHeaders(), ...options.headers },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || errorData.error || 'Erreur API');
      } catch {
        throw new Error(`Erreur ${response.status}: ${errorText.substring(0, 200)}`);
      }
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    console.error('❌ apiFetch error:', error);
    throw error;
  }
};

// =============================================================================
// COMPOSANT PRINCIPAL — CHAT WHATSAPP STYLE
// =============================================================================
const Chat: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🔍 Récupération des IDs du workflow
  const getWorkflowIds = () => {
    const cIdState = location.state?.consultationId;
    const pIdState = location.state?.patientId;
    const cIdStore = localStorage.getItem('current_consultation_id');
    const pIdStore = localStorage.getItem('current_patient_id');
    
    return {
      consultationId: cIdState || (cIdStore ? Number(cIdStore) : null),
      patientId: pIdState || (pIdStore ? Number(pIdStore) : null),
    };
  };

  const [workflowIds] = useState(getWorkflowIds());
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role: string } | null>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // 🎯 Fonction notification
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  // 🎨 Styles notification
  const getNotificationStyles = (): React.CSSProperties => {
    const colors: Record<NotificationType, { bg: string; border: string; text: string }> = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#eff6ff', border: '#c0392b', text: '#1e40af' },
    };
    const c = colors[notification.type];
    return {
      position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
      padding: '16px 20px', borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      borderLeft: `5px solid ${c.border}`,
      backgroundColor: c.bg, color: c.text,
      maxWidth: '450px', minWidth: '350px',
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      animation: 'slideIn 0.3s ease-out',
    };
  };

  // 👤 Charger l'utilisateur connecté
  const fetchCurrentUser = async () => {
    try {
      const data = await apiFetch('auth/me/');
      setCurrentUser({
        id: data.id,
        name: `${data.first_name || ''} ${data.last_name || data.username}`.trim(),
        role: data.role,
      });
      return data;
    } catch (err) {
      console.error('❌ Erreur chargement utilisateur:', err);
      // Fallback
      setCurrentUser({ id: 1, name: 'Pharmacien', role: 'pharmacie' });
    }
  };

  // 📥 Charger les conversations depuis les consultations + messages
  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // 1️⃣ Récupérer les consultations du patient/pharmacien
      const consultations = await apiFetch('consultations/', {
        headers: getAuthHeaders()
      });
      
      // 2️⃣ Formater en conversations style WhatsApp
      const formatted: Conversation[] = (Array.isArray(consultations) ? consultations : []).map((conv: any) => {
        const patientName = conv.patient?.nom 
          ? `${conv.patient.nom} ${conv.patient.prenoms || ''}`.trim()
          : 'Patient';
        
        const specialtyIcon: Record<string, string> = {
          'cardiologie': '❤️',
          'ophtalmo': '👁️',
          'chirurgie': '🔪',
          'urologie': '🧪',
          'general': '🩺',
        };
        
        return {
          id: String(conv.id),
          title: `${specialtyIcon[conv.service] || '🏥'} Consultation ${conv.service || 'Générale'}`,
          customerName: patientName,
          customerPhone: conv.patient?.telephone || '',
          lastMessage: conv.motif_consultation?.substring(0, 50) || 'Nouvelle consultation',
          unreadCount: 0,
          online: true,
          consultationId: conv.id,
          patientId: conv.patient?.id,
          lastMessageTime: conv.date_consultation ? new Date(conv.date_consultation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
          isGroup: true,
          specialty: conv.service,
          participants: [
            { id: conv.patient?.id, name: patientName, role: 'patient' },
            { id: conv.doctor?.id, name: conv.nom_soignant || 'Médecin', role: 'doctor' },
            { id: currentUser?.id, name: currentUser?.name || 'Pharmacien', role: 'pharmacist' },
          ].filter(p => p.id),
        };
      });
      
      // 3️⃣ Ajouter une conversation "Générale Pharmacie" si vide
      if (formatted.length === 0) {
        formatted.push({
          id: 'general',
          title: '💬 Discussion Générale',
          customerName: 'Équipe Pharmacie',
          customerPhone: '',
          lastMessage: 'Bienvenue dans la messagerie de la pharmacie',
          unreadCount: 0,
          online: true,
          isGroup: true,
          participants: [
            { id: 1, name: 'Pharmacien Principal', role: 'pharmacist' },
            { id: 2, name: 'Assistant(e)', role: 'pharmacist' },
          ],
        });
      }
      
      setConversations(formatted);
      
      // Auto-sélection
      if (!selectedConv && formatted.length > 0) {
        // Priorité: consultation avec IDs du workflow
        const workflowConv = formatted.find(c => 
          c.consultationId === workflowIds.consultationId || 
          c.patientId === workflowIds.patientId
        );
        const convToSelect = workflowConv || formatted[0];
        setSelectedConv(convToSelect);
        fetchMessages(convToSelect.id);
      }
      
    } catch (err: any) {
      console.error('❌ Erreur chargement conversations:', err);
      showNotification('error', 'Erreur de chargement', 'Impossible de récupérer les consultations.');
      
      // Fallback mock
      setConversations([
        {
          id: "1",
          title: "❤️ Consultation Cardiologie",
          customerName: "Marie Dupont",
          customerPhone: "+228 90 12 34 56",
          lastMessage: "Merci pour votre aide !",
          unreadCount: 2,
          online: true,
          consultationId: 1,
          patientId: 7,
          lastMessageTime: "10:36",
          isGroup: true,
          specialty: "cardiologie",
          participants: [
            { id: 7, name: "Marie Dupont", role: "patient" },
            { id: 5, name: "Dr. Mensah", role: "doctor" },
            { id: 1, name: "Pharmacien", role: "pharmacist" },
          ],
        },
        {
          id: "2",
          title: "👁️ Consultation Ophtalmo",
          customerName: "Jean Kofi",
          customerPhone: "+228 91 23 45 67",
          lastMessage: "Est-ce que vous avez du Doliprane ?",
          unreadCount: 1,
          online: false,
          consultationId: 2,
          patientId: 8,
          lastMessageTime: "09:15",
          isGroup: true,
          specialty: "ophtalmo",
        },
        {
          id: "general",
          title: "💬 Discussion Générale",
          customerName: "Équipe Pharmacie",
          customerPhone: "",
          lastMessage: "Bienvenue ! 👋",
          unreadCount: 0,
          online: true,
          isGroup: true,
          lastMessageTime: "Hier",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 📥 Charger les messages d'une conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      // Si c'est une consultation, charger depuis l'API des messages
      if (conversationId !== 'general' && !isNaN(Number(conversationId))) {
        const data = await apiFetch(`consultations/${conversationId}/messages/`);
        
        const formatted: Message[] = (Array.isArray(data) ? data : []).map((msg: any) => ({
          id: String(msg.id),
          text: msg.content || msg.text || '',
          sender: msg.sender_role || 'customer',
          senderName: msg.sender_name || 'Utilisateur',
          timestamp: msg.created_at ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
          read: msg.is_read || false,
          consultationId: msg.consultation_id,
          patientId: msg.patient_id,
        }));
        
        setMessages(formatted);
        
        // Marquer comme lus
        if (formatted.some(m => !m.read)) {
          await apiFetch(`consultations/${conversationId}/messages/read/`, { 
            method: 'PATCH',
            headers: getAuthHeaders()
          });
        }
      } else {
        // Mock messages pour démo
        const mockMessages: Record<string, Message[]> = {
          "1": [
            { id: "1", text: "Bonjour, je voudrais savoir si vous avez du Doliprane 1000mg ?", sender: "customer", senderName: "Marie Dupont", timestamp: "10:30", read: true, patientId: 7 },
            { id: "2", text: "Bonjour Marie ! Oui nous en avons en stock. Combien en avez-vous besoin ?", sender: "pharmacist", senderName: "Pharmacien", timestamp: "10:32", read: true },
            { id: "3", text: "J'en voudrais 2 boîtes s'il vous plaît", sender: "customer", senderName: "Marie Dupont", timestamp: "10:33", read: true, patientId: 7 },
            { id: "4", text: "Parfait ! Je vous les prépare. Vous pouvez passer les récupérer quand vous voulez. ❤️", sender: "pharmacist", senderName: "Pharmacien", timestamp: "10:35", read: true },
            { id: "5", text: "Merci pour votre aide ! 🙏", sender: "customer", senderName: "Marie Dupont", timestamp: "10:36", read: false, patientId: 7 },
          ],
          "2": [
            { id: "1", text: "Est-ce que vous avez du Doliprane ?", sender: "customer", senderName: "Jean Kofi", timestamp: "09:15", read: false, patientId: 8 },
          ],
          "general": [
            { id: "1", text: "👋 Bienvenue dans la messagerie de la pharmacie ! Posez vos questions ici.", sender: "pharmacist", senderName: "Pharmacien Principal", timestamp: "08:00", read: true },
            { id: "2", text: "Merci ! J'ai une question sur mes médicaments", sender: "customer", senderName: "Afi Mensah", timestamp: "08:15", read: true, patientId: 9 },
            { id: "3", text: "Je vous écoute, Afi 😊", sender: "pharmacist", senderName: "Assistant(e)", timestamp: "08:16", read: true },
          ],
        };
        
        setMessages(mockMessages[conversationId] || []);
      }
      
    } catch (err: any) {
      console.error('❌ Erreur chargement messages:', err);
      showNotification('error', 'Erreur', 'Impossible de charger les messages.');
    }
  };

  // 📤 Envoyer un message (WhatsApp style)
  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedConv) return;

    setSending(true);
    try {
      const payload = {
        content: inputMessage.trim(),
        consultation_id: selectedConv.consultationId || workflowIds.consultationId,
        patient_id: selectedConv.patientId || workflowIds.patientId,
        sender_role: currentUser?.role || 'pharmacist',
      };

      // Si c'est une vraie consultation, envoyer à l'API
      if (selectedConv.consultationId && !isNaN(Number(selectedConv.consultationId))) {
        await apiFetch(`consultations/${selectedConv.consultationId}/messages/`, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: getAuthHeaders(),
        });
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputMessage,
        sender: currentUser?.role as any || 'pharmacist',
        senderName: currentUser?.name || 'Moi',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        read: true,
        consultationId: payload.consultation_id,
        patientId: payload.patient_id,
      };

      setMessages(prev => [...prev, newMessage]);
      setInputMessage("");
      setShowEmojiPicker(false);
      
      // Mettre à jour la conversation
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConv.id 
          ? { ...conv, lastMessage: inputMessage, lastMessageTime: newMessage.timestamp }
          : conv
      ));

      showNotification('success', 'Message envoyé', 'Votre message a été transmis.');

      // Simulation réponse automatique (pour démo)
      if (selectedConv.isGroup && selectedConv.id === 'general') {
        setTimeout(() => {
          const autoReply: Message = {
            id: (Date.now() + 1).toString(),
            text: "Merci pour votre message ! Un membre de l'équipe vous répondra rapidement. 💊",
            sender: 'pharmacist',
            senderName: 'Assistant(e)',
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            read: false,
          };
          setMessages(prev => [...prev, autoReply]);
        }, 2000);
      }

    } catch (err: any) {
      console.error('❌ Erreur envoi message:', err);
      showNotification('error', 'Échec d\'envoi', err.message || 'Impossible d\'envoyer le message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    fetchMessages(conv.id);
    
    // Propager les IDs dans le workflow
    if (conv.consultationId) localStorage.setItem('current_consultation_id', String(conv.consultationId));
    if (conv.patientId) localStorage.setItem('current_patient_id', String(conv.patientId));
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // Scroll automatique
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Chargement initial
  useEffect(() => {
    const init = async () => {
      await fetchCurrentUser();
      await fetchConversations();
    };
    init();
    
    // Polling toutes les 30s
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrage
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.customerPhone.includes(searchQuery)
  );

  // =============================================================================
  // STYLES WHATSAPP STYLE
  // =============================================================================
  const styles: Record<string, React.CSSProperties> = {
    page: {
      padding: "0",
      minHeight: "100vh",
      fontFamily: "Inter, system-ui, sans-serif",
      backgroundColor: "#d9dbd5", // WhatsApp bg
      display: "flex",
      flexDirection: "column",
    },
    header: {
      backgroundColor: "#0d9488", // Teal header
      padding: "12px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      color: "white",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    },
    headerTitle: {
      fontSize: "20px",
      fontWeight: 600,
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    headerActions: {
      display: "flex",
      gap: "15px",
    },
    headerBtn: {
      background: "none",
      border: "none",
      color: "white",
      cursor: "pointer",
      padding: "8px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background 0.2s",
    },
    mainContainer: {
      display: "flex",
      flex: 1,
      overflow: "hidden",
      maxWidth: "1400px",
      margin: "0 auto",
      width: "100%",
    },
    sidebar: {
      width: "400px",
      backgroundColor: "#fff",
      borderRight: "1px solid #e5e5e5",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    searchContainer: {
      padding: "12px 16px",
      borderBottom: "1px solid #e5e5e5",
      backgroundColor: "#fff",
    },
    searchInput: {
      width: "100%",
      padding: "10px 16px 10px 40px",
      borderRadius: "20px",
      border: "none",
      outline: "none",
      fontSize: "14px",
      backgroundColor: "#f0f2f5",
      transition: "background 0.2s",
    },
    conversationsList: {
      flex: 1,
      overflowY: "auto",
      backgroundColor: "#fff",
    },
    conversationItem: (selected: boolean, online?: boolean) => ({
      padding: "12px 16px",
      backgroundColor: selected ? "#f0f2f5" : "transparent",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      borderBottom: "1px solid #f0f2f5",
      transition: "background 0.2s",
      position: "relative" as const,
    }),
    avatar: (online?: boolean, isGroup?: boolean) => ({
      width: "50px",
      height: "50px",
      borderRadius: isGroup ? "12px" : "50%",
      backgroundColor: "#c0392b",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      fontSize: "18px",
      position: "relative" as const,
      flexShrink: 0,
    }),
    onlineIndicator: {
      position: "absolute" as const,
      bottom: "2px",
      right: "2px",
      width: "14px",
      height: "14px",
      borderRadius: "50%",
      backgroundColor: "#22c55e",
      border: "2px solid #fff",
    },
    conversationInfo: {
      flex: 1,
      minWidth: 0,
    },
    conversationHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "4px",
    },
    conversationName: {
      fontWeight: 600,
      color: "#1e293b",
      fontSize: "15px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    conversationTime: {
      fontSize: "12px",
      color: "#64748b",
    },
    conversationPreview: {
      fontSize: "14px",
      color: "#64748b",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    unreadBadge: {
      background: "#22c55e",
      color: "white",
      fontSize: "11px",
      padding: "3px 8px",
      borderRadius: "12px",
      fontWeight: "bold",
      marginLeft: "auto",
    },
    chatArea: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#efeae2", // WhatsApp chat bg
      backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23d9dbd5\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
    },
    chatHeader: {
      padding: "12px 20px",
      backgroundColor: "#f0f2f5",
      borderBottom: "1px solid #e5e5e5",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    chatHeaderInfo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    chatHeaderName: {
      fontWeight: 600,
      color: "#1e293b",
      fontSize: "16px",
    },
    chatHeaderStatus: {
      fontSize: "12px",
      color: "#64748b",
    },
    chatHeaderActions: {
      display: "flex",
      gap: "20px",
    },
    messagesContainer: {
      flex: 1,
      overflowY: "auto",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    messageRow: (sender: string) => ({
      display: "flex",
      justifyContent: sender === (currentUser?.role || 'pharmacist') ? "flex-end" : "flex-start",
      maxWidth: "75%",
      alignSelf: sender === (currentUser?.role || 'pharmacist') ? "flex-end" : "flex-start",
    }),
    messageBubble: (sender: string) => ({
      backgroundColor: sender === (currentUser?.role || 'pharmacist') ? "#d9f99d" : "#fff",
      color: "#1e293b",
      padding: "8px 12px",
      borderRadius: sender === (currentUser?.role || 'pharmacist') ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
      fontSize: "14px",
      lineHeight: "1.4",
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      position: "relative" as const,
      wordWrap: "break-word" as const,
      maxWidth: "100%",
    }),
    messageSender: {
      fontSize: "12px",
      fontWeight: 600,
      color: "#c0392b",
      marginBottom: "4px",
    },
    messageTime: {
      fontSize: "10px",
      color: "#64748b",
      textAlign: "right" as const,
      marginTop: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "4px",
    },
    messageRead: {
      color: "#3b82f6",
    },
    inputContainer: {
      padding: "12px 20px",
      backgroundColor: "#f0f2f5",
      borderTop: "1px solid #e5e5e5",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    actionBtn: {
      background: "none",
      border: "none",
      color: "#54656f",
      cursor: "pointer",
      padding: "8px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background 0.2s",
    },
    messageInput: {
      flex: 1,
      padding: "12px 16px",
      borderRadius: "24px",
      border: "none",
      outline: "none",
      fontSize: "15px",
      backgroundColor: "#fff",
      transition: "box-shadow 0.2s",
    },
    sendButton: (enabled: boolean) => ({
      width: "45px",
      height: "45px",
      borderRadius: "50%",
      backgroundColor: enabled ? "#0d9488" : "#94a3b8",
      color: "#fff",
      border: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: enabled ? "pointer" : "default",
      transition: "0.2s",
      boxShadow: enabled ? "0 2px 8px rgba(13, 148, 136, 0.4)" : "none",
    }),
    emojiPicker: {
      position: "absolute" as const,
      bottom: "70px",
      right: "20px",
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: "12px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: "8px",
      zIndex: 1000,
      border: "1px solid #e5e5e5",
    },
    emojiBtn: {
      fontSize: "20px",
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "4px",
      borderRadius: "8px",
      transition: "background 0.2s",
    },
    loadingOverlay: {
      position: "absolute" as const,
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(255,255,255,0.9)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    emptyState: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "#64748b",
      padding: "40px",
      textAlign: "center" as const,
    },
    participantsList: {
      display: "flex",
      gap: "-8px",
      marginLeft: "8px",
    },
    participantAvatar: (index: number) => ({
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      backgroundColor: ["#c0392b", "#3498db", "#2ecc71", "#f39c12"][index % 4],
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "10px",
      fontWeight: "bold",
      border: "2px solid #fff",
      marginLeft: index > 0 ? "-8px" : "0",
    }),
  };

  // Emojis rapides
  const quickEmojis = ["👍", "❤️", "😊", "🙏", "💊", "✅", "📋", "🏥", "🩺", "💬", "👋", "🎉"];

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={styles.page}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus, textarea:focus { box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.3) !important; }
        .conversation-item:hover { background-color: #f5f5f5 !important; }
        .action-btn:hover { background-color: #e5e5e5 !important; }
        .emoji-btn:hover { background-color: #f0f2f5 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #c0392b; border-radius: 3px; }
      `}</style>

      {/* 🔔 Notification */}
      {notification.show && (
        <div style={getNotificationStyles()} role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ fontSize: '18px', color: notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#22c55e' : '#0d9488' }}>
              {notification.type === 'success' && <CheckCircle size={18} />}
              {notification.type === 'error' && <AlertTriangle size={18} />}
              {notification.type === 'info' && <Info size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{notification.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{notification.message}</p>
              {notification.details?.map((d, i) => <div key={i} style={{ fontSize: '12px' }}>• {d}</div>)}
            </div>
            <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>
          <MessageSquare size={24} /> 💬 MediChat Pharmacie
        </h1>
        <div style={styles.headerActions}>
          <button style={styles.headerBtn} title="Nouvelle conversation">
            <MessageSquare size={20} />
          </button>
          <button 
            style={styles.headerBtn} 
            title="Profil"
            onClick={() => navigate('/pharmacie/profile')}
          >
            <User size={20} />
          </button>
        </div>
      </header>

      <div style={styles.mainContainer}>
        
        {/* SIDEBAR - LISTE DES CONVERSATIONS */}
        <div style={styles.sidebar}>
          {/* Search */}
          <div style={styles.searchContainer}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Rechercher une consultation ou un patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Conversations */}
          <div style={styles.conversationsList}>
            {loading ? (
              <div style={styles.loadingOverlay}>
                <div style={{ animation: 'spin 1s linear infinite', fontSize: '24px' }}>⏳</div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <p>Aucune conversation trouvée</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  style={styles.conversationItem(selectedConv?.id === conv.id, conv.online)}
                  className="conversation-item"
                >
                  {/* Avatar */}
                  <div style={styles.avatar(conv.online, conv.isGroup)}>
                    {conv.isGroup ? '👥' : conv.customerName[0]?.toUpperCase()}
                    {conv.online && <div style={styles.onlineIndicator} />}
                  </div>
                  
                  {/* Info */}
                  <div style={styles.conversationInfo}>
                    <div style={styles.conversationHeader}>
                      <span style={styles.conversationName}>{conv.title}</span>
                      <span style={styles.conversationTime}>{conv.lastMessageTime}</span>
                    </div>
                    <div style={styles.conversationPreview}>
                      {conv.unreadCount > 0 && <span style={{ color: '#c0392b', fontWeight: 'bold' }}>●</span>}
                      <span style={{ 
                        color: conv.unreadCount > 0 ? '#1e293b' : '#64748b',
                        fontWeight: conv.unreadCount > 0 ? 500 : 400
                      }}>
                        {conv.lastMessage}
                      </span>
                    </div>
                  </div>
                  
                  {/* Badge non lus */}
                  {conv.unreadCount > 0 && (
                    <span style={styles.unreadBadge}>{conv.unreadCount}</span>
                  )}
                  
                  {/* Participants pour les groupes */}
                  {conv.isGroup && conv.participants && conv.participants.length > 0 && (
                    <div style={styles.participantsList}>
                      {conv.participants.slice(0, 3).map((p, i) => (
                        <div key={p.id} style={styles.participantAvatar(i)} title={p.name}>
                          {p.name[0]?.toUpperCase()}
                        </div>
                      ))}
                      {conv.participants.length > 3 && (
                        <div style={{...styles.participantAvatar(3), backgroundColor: '#64748b'}}>
                          +{conv.participants.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ZONE DE CHAT PRINCIPALE */}
        <div style={styles.chatArea}>
          {selectedConv ? (
            <>
              {/* Header du chat */}
              <div style={styles.chatHeader}>
                <div style={styles.chatHeaderInfo}>
                  <div style={styles.avatar(selectedConv.online, selectedConv.isGroup)}>
                    {selectedConv.isGroup ? '👥' : selectedConv.customerName[0]?.toUpperCase()}
                    {selectedConv.online && !selectedConv.isGroup && <div style={styles.onlineIndicator} />}
                  </div>
                  <div>
                    <div style={styles.chatHeaderName}>{selectedConv.title}</div>
                    <div style={styles.chatHeaderStatus}>
                      {selectedConv.isGroup 
                        ? `${selectedConv.participants?.length || 2} participants` 
                        : selectedConv.online ? 'En ligne' : 'Hors ligne'}
                    </div>
                  </div>
                </div>
                <div style={styles.chatHeaderActions}>
                  <button style={styles.actionBtn} className="action-btn" title="Appeler">
                    <Phone size={20} />
                  </button>
                  <button style={styles.actionBtn} className="action-btn" title="Plus d'options">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} style={styles.messagesContainer}>
                {messages.length === 0 ? (
                  <div style={styles.emptyState}>
                    <MessageSquare size={64} style={{ marginBottom: "16px", opacity: 0.3, color: '#c0392b' }} />
                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>Aucun message dans cette conversation</p>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>Commencez la discussion avec votre patient ou l'équipe</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.sender === (currentUser?.role || 'pharmacist');
                    const showSender = !isMe && (index === 0 || messages[index - 1].sender !== msg.sender);
                    
                    return (
                      <div key={msg.id} style={styles.messageRow(msg.sender)}>
                        <div>
                          {showSender && !isMe && (
                            <div style={styles.messageSender}>{msg.senderName}</div>
                          )}
                          <div style={styles.messageBubble(msg.sender)}>
                            {msg.text}
                            <div style={styles.messageTime}>
                              {msg.timestamp}
                              {isMe && (
                                msg.read ? (
                                  <CheckCheck size={14} style={styles.messageRead} />
                                ) : (
                                  <Check size={14} />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input + Actions */}
              <div style={styles.inputContainer}>
                {/* Emoji picker */}
                {showEmojiPicker && (
                  <div style={styles.emojiPicker}>
                    {quickEmojis.map((emoji, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleEmojiSelect(emoji)}
                        style={styles.emojiBtn}
                        className="emoji-btn"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                
                <button 
                  style={styles.actionBtn} 
                  className="action-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Émojis"
                >
                  <Smile size={20} />
                </button>
                
                <button style={styles.actionBtn} className="action-btn" title="Joindre un fichier">
                  <Paperclip size={20} />
                </button>
                
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Écrivez un message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={styles.messageInput}
                  disabled={sending}
                />
                
                <button 
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || sending}
                  style={styles.sendButton(!!inputMessage.trim() && !sending)}
                  title="Envoyer"
                >
                  {sending ? (
                    <div style={{ animation: 'spin 1s linear infinite' }}>⏳</div>
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <MessageSquare size={80} style={{ marginBottom: "24px", opacity: 0.2, color: '#c0392b' }} />
              <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>
                MediChat Pharmacie
              </p>
              <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '300px' }}>
                Sélectionnez une consultation pour discuter avec votre patient, ou rejoignez la discussion générale de l'équipe.
              </p>
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => navigate('/old-consultation')}
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#c0392b', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 500
                  }}
                >
                  <Users size={18} /> Voir les consultations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;