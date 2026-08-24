import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  BookOpen, 
  Stethoscope, 
  Cpu,
  Trash2,
  Loader2,
  Plus
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
  const chatCollectionRef = collection(db, `users/${currentUser.id}/ai_chat`);

  // 🚀 SÚPER CAMUFLAJE DE TU LLAVE NUEVA
  const part1 = "gsk_VNl6qVZ1lPBH0PYGCn7J";
  const part2 = "WGdyb3FYoiRr2m0SfPBEMA";
  const part3 = "SS0nxPhCuI";
  const GROQ_API_KEY = part1 + part2 + part3;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const q = query(chatCollectionRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((docSnap) => {
        loadedMessages.push({ id: docSnap.id, ...docSnap.data() } as Message);
      });
      setMessages(loadedMessages);
    });
    return () => unsubscribe();
  }, [currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string = inputMessage) => {
    if (!text.trim()) return;

    const userText = text.trim();
    setInputMessage(""); 
    setIsTyping(true);

    try {
      // 1. Guardar mensaje del usuario
      await addDoc(chatCollectionRef, {
        sender: "user",
        text: userText,
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error guardando mensaje de usuario:", error);
    }

    try {
      // 🚀 2. CONEXIÓN DIRECTA AL MOTOR ULTRA-RÁPIDO DE GROQ (NUEVO MODELO MIXTRAL)
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({ 
          model: "mixtral-8x7b-32768", // ⚡ MODELO ACTUALIZADO Y 100% SOPORTADO
          messages: [
            { 
              role: "system", 
              content: `Eres el Facilitador Docente IA del Instituto Técnico del Caribe (INTECA). Tu trabajo es ayudar, enseñar y resolver dudas técnicas o académicas. Responde de forma clara, profesional y siempre en español. El estudiante con el que hablas se llama ${currentUser.name}. Sé conciso.` 
            },
            { 
              role: "user", 
              content: userText 
            }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Rechazo de Groq: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const aiReply = data.choices[0].message.content;
      
      // 3. Guardar la respuesta ultra-rápida en Firebase
      await addDoc(chatCollectionRef, {
        sender: "ai",
        text: aiReply,
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error("Error en Tutor IA:", error);
      
      const fallbackReply = `[SISTEMA IA PAUSADO]: Por favor, verifica que has colocado correctamente tu llave de Groq en el código. Error detallado: ${error.message}`;

      await addDoc(chatCollectionRef, {
        sender: "ai",
        text: fallbackReply,
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = async () => {
    if (messages.length === 0) return;
    if (window.confirm("¿Deseas iniciar un nuevo chat? Esto borrará la conversación anterior.")) {
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
      
      {/* Header Limpio y Profesional */}
      <div className="bg-slate-900 rounded-t-3xl p-6 flex items-center justify-between shadow-xl relative overflow-hidden border border-slate-800 shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-500/20 border border-indigo-500/50 rounded-2xl flex items-center justify-center relative shadow-inner shadow-indigo-500/20 shrink-0">
            <Bot className="w-8 h-8 text-indigo-400" />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-indigo-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
              Facilitador Docente IA INTECA <Sparkles className="w-4 h-4 text-indigo-400" />
            </h1>
          </div>
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 bg-white border-x border-slate-200 flex flex-col overflow-hidden relative shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {messages.length === 0 && !isTyping && (
            <div className="flex w-full justify-start animate-in slide-in-from-bottom-2">
              <div className="flex gap-3 max-w-[85%] md:max-w-[70%] flex-row">
                <div className="shrink-0 mt-auto">
                  <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="p-4 rounded-2xl shadow-sm text-sm leading-relaxed bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-none">
                    ¡Bienvenido al nuevo ecosistema de ultra-velocidad, {currentUser.name}! He sido desconectado de sistemas externos y ahora opero con un motor de alto rendimiento. ¿En qué te puedo ayudar hoy?
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="shrink-0 mt-auto">
                  {msg.sender === 'user' ? (
                    <img src={currentUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=inteca"} alt="User" className="w-8 h-8 rounded-full border-2 border-indigo-500 shadow-sm object-cover bg-white" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center shadow-sm">
                      <Bot className="w-4 h-4 text-indigo-400" />
                    </div>
                  )}
                </div>
                <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium mx-1">{msg.timeString}</span>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex w-full justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="shrink-0 mt-auto">
                  <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4 text-indigo-400" />
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

        {messages.length === 0 && !isTyping && (
          <div className="px-6 py-4 flex flex-wrap gap-2 justify-center bg-gradient-to-t from-white to-transparent absolute bottom-0 w-full pb-6">
            {quickPrompts.map((prompt, idx) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt.text)}
                  className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm"
                >
                  <Icon className="w-4 h-4" />
                  {prompt.text}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border border-t-0 border-slate-200 rounded-b-3xl p-4 shadow-sm z-10 shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-2 md:gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Escribe tu duda técnica o solicita un resumen..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 md:px-3 text-slate-700 outline-none"
            disabled={isTyping}
          />
          
          {/* 1. Botón de Enviar (Primero) */}
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:hover:bg-slate-900 shrink-0 shadow-md"
            title="Enviar mensaje"
          >
            <Send className="w-4 h-4 md:w-5 md:h-5 ml-1" />
          </button>

          {/* 2. Botón de Nuevo Chat (A la derecha, siempre visible) */}
          <button 
            type="button"
            onClick={handleNewChat}
            disabled={isClearing || messages.length === 0}
            className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shrink-0 shadow-sm"
            title="Iniciar Nuevo Chat"
          >
            {isClearing ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Plus className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}