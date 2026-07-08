import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Bot, 
  BookOpen, 
  Layers, 
  FileCheck, 
  AlertCircle,
  Loader2,
  Bookmark
} from "lucide-react";
import { ChatMessage, UserProfile } from "../types";

interface AIEducatorProps {
  currentUser: UserProfile;
}

export default function AIEducator({ currentUser }: AIEducatorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `¡Hola, ${currentUser.name}! Soy **INTECA Intellect**, tu mentor inteligente 24/7. Estoy capacitado para explicar conceptos complejos de telemedicina, enrutamiento de redes o ciberseguridad avanzada. 

¿Qué tema técnico te gustaría desglozar hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSimulatedMode, setIsSimulatedMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const presets = [
    { label: "Explicar Triaje Clínico", text: "Explícame de forma sencilla cómo funciona el protocolo de triaje médico remoto en teleasistencia paramédica rural.", icon: BookOpen },
    { label: "Conceptos Zero Trust", text: "Explica detalladamente la arquitectura Zero Trust en seguridad de bases de datos críticas de salud.", icon: Layers },
    { label: "Resumen de Enrutamiento", text: "Hazme un resumen ejecutivo del enrutamiento OSPF multiplexado contra ataques DDoS.", icon: FileCheck },
    { label: "Plan de Estudio", text: "Créame un plan de estudio personalizado para dominar redes inalámbricas del Caribe en 2 semanas.", icon: Bookmark }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          courseContext: "Instituto Técnico del Caribe (INTECA)"
        })
      });

      const data = await response.json();
      setIsSimulatedMode(!!data.isSimulated);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: data.text || "Disculpa, he tenido una fluctuación de datos. ¿Podrías reintentar tu pregunta?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Assistant contact error:", err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "system",
          text: "Error de red al sincronizar con el tutor de IA. Verifique que el servidor local está activo.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-educator-root" className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Soporte Académico Autónomo
          </span>
          <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">Tutoría Inteligente 24/7</h1>
        </div>
        
        {isSimulatedMode && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Respuestas simuladas (Configurar API KEY para IA Real)</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-950 font-display text-sm flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>Instrucciones Rápidas</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Haz clic en cualquiera de estas guías para iniciar un análisis profundo del modelo educativo INTECA.
            </p>
            <div className="space-y-2.5">
              {presets.map((preset, idx) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(preset.text)}
                    disabled={loading}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs font-semibold text-slate-800 transition-all flex items-center gap-2.5 disabled:opacity-50"
                  >
                    <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-600">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[520px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm">II</div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">INTECA Intellect v3.2</h3>
                <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Disponible
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/20">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isSystem = msg.sender === 'system';
              if (isSystem) return (
                <div key={msg.id} className="text-center py-2 text-xs font-semibold text-rose-500 bg-rose-50 rounded-xl max-w-md mx-auto border border-rose-100">{msg.text}</div>
              );
              return (
                <div key={msg.id} className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${isUser ? 'bg-slate-900' : 'bg-emerald-600'}`}>
                    {isUser ? 'YO' : 'IA'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                      <span className="font-bold text-slate-900">{isUser ? currentUser.name : 'INTECA Intellect'}</span>
                    </div>
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed border shadow-sm ${
                      isUser ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border-slate-100 text-slate-800 rounded-tl-none whitespace-pre-wrap'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-3 mr-auto max-w-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">IA</div>
                <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span className="text-xs text-slate-400">Analizando base académica...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
              placeholder="Pregunta sobre telemedicina, encriptación, redes..."
              className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={loading || !inputText.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-2xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}