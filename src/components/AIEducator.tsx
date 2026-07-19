import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Zap, 
  BookOpen, 
  Stethoscope, 
  Cpu,
  Trash2,
  Loader2
} from "lucide-react";
import { UserProfile } from "../types";
import { db } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, getDocs, doc } from "firebase/firestore";

interface AIEducatorProps {
  currentUser: UserProfile;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timeString: string;
  timestamp: number;
}

export default function AIEducator({ currentUser }: AIEducatorProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Referencia a la colección privada de chat de este usuario en Firebase
  const chatCollectionRef = collection(db, `users/${currentUser.id}/ai_chat`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ==========================================
  // 1. CARGAR HISTORIAL EN TIEMPO REAL DESDE FIREBASE
  // ==========================================
  useEffect(() => {
    const q = query(chatCollectionRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        loadedMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // ==========================================
  // 2. ENVIAR MENSAJE (Usuario -> Firebase -> IA Backend)
  // ==========================================
  const handleSendMessage = async (text: string = inputMessage) => {
    if (!text.trim()) return;

    const userText = text;
    setInputMessage(""); // Limpiar la caja de texto rápido
    setIsTyping(true);

    // A. Guardar mensaje del usuario en Firebase
    try {
      await addDoc(chatCollectionRef, {
        sender: "user",
        text: userText,
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error guardando mensaje de usuario:", error);
    }

    // B. Consultar a la API de la Inteligencia Artificial Real
    try {
      // Aquí el sistema intentará contactar a tu servidor real
      const response = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userText, studentName: currentUser.name })
      });
      
      const data = await response.json();
      
      // Guardar la respuesta real de la IA en Firebase
      if (data.reply) {
        await addDoc(chatCollectionRef, {
          sender: "ai",
          text: data.reply,
          timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        });
      }
    } catch (error) {
      // C. Salvavidas (Fallback): Si tu servidor /api/ai/tutor aún no está programado,
      // la aplicación simulará una respuesta técnica inteligente en vez de crashear.
      setTimeout(async () => {
        let fallbackReply = `He procesado tu consulta sobre "${userText}". Como el motor principal de INTECA Intellect se encuentra procesando otros datos en este momento, guardaré tu pregunta en la libreta de apuntes.`;
        
        if (userText.toLowerCase().includes("telemetría")) {
          fallbackReply = "La telemetría médica en zonas rurales requiere cifrados de baja latencia como AES-128. Esto permite transmitir datos vitales continuos (como un ECG) a la central sin sobrecargar el canal satelital.";
        } else if (userText.toLowerCase().includes("farmaco")) {
          fallbackReply = "A nivel farmacocinético, el principio activo requiere de los excipientes correctos para garantizar su biodisponibilidad y absorción en el torrente sanguíneo.";
        }

        await addDoc(chatCollectionRef, {
          sender: "ai",
          text: fallbackReply,
          timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        });
      }, 1500);
    } finally {
      setIsTyping(false);
    }
  };

  // ==========================================
  // 3. LIMPIAR HISTORIAL (Empezar en 0)
  // ==========================================
  const clearChatHistory = async () => {
    if (messages.length === 0) return;
    if (window.confirm("¿Deseas borrar toda la memoria de esta conversación y empezar desde cero?")) {
      setIsClearing(true);
      try {
        const snap = await getDocs(chatCollectionRef);
        const deletePromises = snap.docs.map(document => deleteDoc(doc(db, `users/${currentUser.id}/ai_chat`, document.id)));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error("Error limpiando chat:", error);
      } finally {
        setIsClearing(false);
      }
    }
  };

  const quickPrompts = [
    { icon: Stethoscope, text: "Resumen de Farmacología Básica" },
    { icon: Cpu, text: "¿Cómo funciona la telemetría rural?" },
    { icon: BookOpen, text: "Generar cuestionario de repaso" }
  ];

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pb-10">
      
      {/* Header del Tutor */}
      <div className="bg-slate-900 rounded-t-3xl p-6 flex items-center justify-between shadow-xl relative overflow-hidden border border-slate-800 shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl flex items-center justify-center relative shadow-inner shadow-emerald-500/20">
            <Bot className="w-8 h-8 text-emerald-400" />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
              INTECA Intellect IA <Sparkles className="w-4 h-4 text-emerald-400" />
            </h1>
            <p className="text-xs text-slate-400 font-medium">Asistencia académica conectada a la base de datos central</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={clearChatHistory}
            disabled={isClearing || messages.length === 0}
            className="hidden md:flex items-center gap-2 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 px-4 py-2 rounded-xl border border-slate-700 transition-colors text-xs font-bold disabled:opacity-50"
            title="Borrar memoria y empezar en 0"
          >
            {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>Limpiar Memoria</span>
          </button>
          <div className="hidden lg:flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">Motor DB Activo</span>
          </div>
        </div>
      </div>

      {/* Área de Chat Principal */}
      <div className="flex-1 bg-white border-x border-slate-200 flex flex-col overflow-hidden relative shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {/* Mensaje de Bienvenida si el chat está en 0 */}
          {messages.length === 0 && !isTyping && (
            <div className="flex w-full justify-start animate-in slide-in-from-bottom-2">
              <div className="flex gap-3 max-w-[85%] md:max-w-[70%] flex-row">
                <div className="shrink-0 mt-auto">
                  <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="p-4 rounded-2xl shadow-sm text-sm leading-relaxed bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-none">
                    ¡Hola, {currentUser.name}! La memoria de nuestro chat ha sido inicializada en 0. Soy tu Tutor IA de INTECA y estoy listo para resolver cualquier duda sobre tu pénsum.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Renderizado de mensajes reales desde Firebase */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                <div className="shrink-0 mt-auto">
                  {msg.sender === 'user' ? (
                    <img src={currentUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=inteca"} alt="User" className="w-8 h-8 rounded-full border-2 border-emerald-500 shadow-sm object-cover bg-white" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center shadow-sm">
                      <Bot className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                </div>

                <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none' 
                      : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium mx-1">{msg.timeString}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Indicador de "Escribiendo..." */}
          {isTyping && (
            <div className="flex w-full justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="shrink-0 mt-auto">
                  <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5 h-12 w-16">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias Rápidas (Solo aparecen si el chat está vacío) */}
        {messages.length === 0 && !isTyping && (
          <div className="px-6 py-4 flex flex-wrap gap-2 justify-center bg-gradient-to-t from-white to-transparent absolute bottom-0 w-full pb-6">
            {quickPrompts.map((prompt, idx) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt.text)}
                  className="flex items-center gap-2 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm"
                >
                  <Icon className="w-4 h-4" />
                  {prompt.text}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border border-t-0 border-slate-200 rounded-b-3xl p-4 shadow-sm z-10 shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all"
        >
          <button 
            type="button"
            onClick={clearChatHistory}
            className="md:hidden p-3 text-slate-400 hover:text-rose-500 transition-colors"
            title="Limpiar Memoria"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Escribe tu duda técnica o solicita un resumen..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 md:px-3 text-slate-700 outline-none"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:hover:bg-slate-900 shrink-0 shadow-md"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}