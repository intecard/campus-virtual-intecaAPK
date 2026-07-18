import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Zap, 
  BookOpen, 
  Stethoscope, 
  Cpu
} from "lucide-react";
import { UserProfile } from "../types";

interface AIEducatorProps {
  currentUser: UserProfile;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export default function AIEducator({ currentUser }: AIEducatorProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "ai",
      text: `¡Hola, ${currentUser.name}! Soy tu Tutor IA de INTECA. Estoy disponible 24/7 para resolver tus dudas sobre farmacología, telemetría médica, redes clínicas o cualquier tema de tu pénsum. ¿En qué te puedo ayudar hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (text: string = inputMessage) => {
    if (!text.trim()) return;

    const newUserMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputMessage("");
    setIsTyping(true);

    // Simulación de respuesta inteligente de la IA
    setTimeout(() => {
      let aiResponseText = "Entiendo tu consulta. Como modelo de prueba, registro tu pregunta. En la versión de producción, aquí se conectará la base de datos de conocimientos médicos y técnicos de INTECA para darte una respuesta exacta.";
      
      if (text.toLowerCase().includes("telemetría")) {
        aiResponseText = "La telemetría médica permite la transmisión de datos fisiológicos a distancia. En entornos rurales, como vimos en la clase del Prof. Mendoza, optimizar la latencia mediante cifrados ligeros como AES-128 es fundamental para no perder conectividad crítica.";
      } else if (text.toLowerCase().includes("farmaco") || text.toLowerCase().includes("principio activo")) {
        aiResponseText = "El principio activo es la sustancia química responsable del efecto terapéutico. A diferencia de los excipientes, es el núcleo de la acción del medicamento en el organismo.";
      }

      const newAiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, newAiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const quickPrompts = [
    { icon: Stethoscope, text: "Resumen de Farmacología Básica" },
    { icon: Cpu, text: "¿Cómo funciona la telemetría rural?" },
    { icon: BookOpen, text: "Generar cuestionario de repaso" }
  ];

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {/* Header del Tutor */}
      <div className="bg-slate-900 rounded-t-3xl p-6 flex items-center justify-between shadow-lg relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl flex items-center justify-center relative shadow-inner shadow-emerald-500/20">
            <Bot className="w-8 h-8 text-emerald-400" />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
              Tutor IA de INTECA <Sparkles className="w-4 h-4 text-emerald-400" />
            </h1>
            <p className="text-xs text-slate-400 font-medium">Asistencia académica automatizada y disponible 24/7</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700 backdrop-blur-sm relative z-10">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-200">Motor de Respuestas Activo</span>
        </div>
      </div>

      {/* Área de Chat Principal */}
      <div className="flex-1 bg-white border-x border-slate-200 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className="shrink-0 mt-auto">
                  {msg.sender === 'user' ? (
                    <img src={currentUser.avatar} alt="User" className="w-8 h-8 rounded-full border-2 border-emerald-500 shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center shadow-sm">
                      <Bot className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                </div>

                {/* Burbuja de mensaje */}
                <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none' 
                      : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium mx-1">{msg.timestamp}</span>
                </div>

              </div>
            </div>
          ))}

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

        {/* Sugerencias Rápidas */}
        {messages.length === 1 && (
          <div className="px-6 py-4 flex flex-wrap gap-2 justify-center bg-gradient-to-t from-white to-transparent absolute bottom-20 w-full pb-10">
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
      <div className="bg-white border border-t-0 border-slate-200 rounded-b-3xl p-4 shadow-sm z-10">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Escribe tu duda técnica o solicita un resumen..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 text-slate-700 outline-none"
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