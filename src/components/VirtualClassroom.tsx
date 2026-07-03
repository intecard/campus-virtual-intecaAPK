import { useState, useRef, useEffect } from "react";
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Tv, 
  Hand, 
  MessageSquare, 
  Sparkles, 
  Users, 
  LogOut, 
  Palette, 
  Eraser, 
  FileText,
  Volume2,
  CheckCircle2,
  VolumeX,
  Play
} from "lucide-react";
import { UserProfile } from "../types";

interface VirtualClassroomProps {
  currentUser: UserProfile;
}

export default function VirtualClassroom({ currentUser }: VirtualClassroomProps) {
  // Videocall states
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasHandRaised, setHasHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'whiteboard' | 'ai'>('ai');

  // Interactive Whiteboard states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#10b981'); // Brand green
  const [brushSize, setBrushSize] = useState(4);
  const [whiteboardEnabled, setWhiteboardEnabled] = useState(false);

  // Chat message states
  const [chatMessages, setChatMessages] = useState([
    { sender: "Soporte Técnico", text: "¡Bienvenidos al Aula Virtual INTECA! La clase está siendo grabada.", time: "12:00" },
    { sender: "Prof. Mendoza", text: "Hola a todos, hoy analizaremos telemetría de emergencia rural.", time: "12:02" },
    { sender: "Clara Bermúdez", text: "Hola profesor, ¿cuáles son los límites de latencia?", time: "12:03" }
  ]);
  const [newMessage, setNewMessage] = useState("");

  // AI Transcript and translation states
  const [selectedLanguage, setSelectedLanguage] = useState<'es' | 'en' | 'fr'>('es');
  const [transcripts, setTranscripts] = useState([
    {
      speaker: "Prof. Mendoza",
      es: "Bienvenidos a la sesión técnica. Cuando enviamos telemetría médica desde una ambulancia rural, la latencia es crítica.",
      en: "Welcome to the technical session. When we send medical telemetry from a rural ambulance, latency is critical.",
      fr: "Bienvenue à la session technique. Lorsque nous envoyons de la télémétrie médicale depuis une ambulance rurale, la latence est critique."
    },
    {
      speaker: "Prof. Mendoza",
      es: "Por ello, implementamos cifrado ligero AES-128 que consume menos recursos del canal satelital y asegura el flujo continuo.",
      en: "Therefore, we implement lightweight AES-128 encryption that consumes fewer satellite channel resources and ensures continuous flow.",
      fr: "C'est pourquoi nous implémentons un chiffrement léger AES-128 qui consomme moins de ressources du canal satellite et assure un flux continu."
    }
  ]);
  const [aiSummary, setAiSummary] = useState("Soporte vital remoto coordinado. El tutor sugiere estudiar la resiliencia climática de enlaces microondas de 2.4 GHz en zonas rurales.");

  // Drawing Canvas setup and mouse handlers
  useEffect(() => {
    if (activeTab === 'whiteboard' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Fill canvas background to white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get correct mouse coordinates inside canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { sender: currentUser.name, text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setNewMessage("");
  };

  return (
    <div id="virtual-classroom-root" className="space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-mono font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
          Salón de Videoconferencia HD • INTECA Live
        </span>
        <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">Sala Virtual: Redes Críticas y Teleasistencia</h1>
      </div>

      {/* Main Grid: video box & sidebar utility */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: HD Stream Video & Classroom action buttons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-lg flex flex-col justify-between p-4">
            
            {/* Top Indicator overlays */}
            <div className="flex justify-between items-center z-10 w-full">
              <span className="bg-black/60 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-mono tracking-wider flex items-center gap-1.5 border border-white/5">
                <Users className="w-3.5 h-3.5 text-brand-green" />
                <span>14 Alumnos Conectados</span>
              </span>
              <span className="bg-rose-500 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest animate-pulse">
                Grabando HD
              </span>
            </div>

            {/* Video streams / Active speaker */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isCamOn ? (
                <div className="w-full h-full relative">
                  {/* Dynamic simulated presentation slide or active professor webcam */}
                  <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-8">
                    <div className="bg-brand-blue/30 p-6 rounded-3xl border border-brand-blue-light/50 max-w-md space-y-3">
                      <Tv className="w-12 h-12 text-brand-green mx-auto" />
                      <h4 className="font-display font-bold text-slate-100 text-sm md:text-base">Transmisión de Pantalla del Instructor</h4>
                      <p className="text-xs text-slate-400">Prof. Carlos Mendoza está compartiendo el diagrama de flujos de Telemetría Clínica para Emergencias Rurales.</p>
                      
                      {/* Diagram representation */}
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-[10px] text-brand-green flex justify-between items-center">
                        <span>[ Ambulancia Rural ]</span>
                        <span className="text-white">-- AES-128-GCM --&gt;</span>
                        <span>[ Central Clínico ]</span>
                      </div>
                    </div>
                  </div>

                  {/* Professor Thumbnail */}
                  <div className="absolute bottom-4 right-4 w-32 h-24 bg-slate-800 rounded-2xl overflow-hidden border-2 border-brand-green shadow-lg z-10">
                    <img 
                      src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200" 
                      alt="Profesor" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-white">
                      Prof. Mendoza
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <VideoOff className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Has apagado la transmisión de video.</p>
                </div>
              )}
            </div>

            {/* Bottom Student overlay if hand raised */}
            <div className="z-10 self-start mt-auto">
              {hasHandRaised && (
                <div className="bg-brand-green text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-brand-green/30">
                  <Hand className="w-3.5 h-3.5 fill-white" />
                  <span>Has levantado la mano para participar</span>
                </div>
              )}
            </div>
          </div>

          {/* Call Controls panel */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-2">
              <button 
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-3 rounded-xl border transition-all ${isMicOn ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-rose-500/10 border-rose-500 text-rose-500 hover:bg-rose-500/20'}`}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsCamOn(!isCamOn)}
                className={`p-3 rounded-xl border transition-all ${isCamOn ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-rose-500/10 border-rose-500 text-rose-500 hover:bg-rose-500/20'}`}
              >
                {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`p-3 rounded-xl border transition-all ${isScreenSharing ? 'bg-brand-green/10 border-brand-green text-brand-green hover:bg-brand-green/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                <Tv className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setHasHandRaised(!hasHandRaised)}
                className={`p-3 rounded-xl border transition-all ${hasHandRaised ? 'bg-brand-green/10 border-brand-green text-brand-green hover:bg-brand-green/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                <Hand className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 text-xs">
              <button className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-2 px-4 rounded-xl transition-all">
                Asistencia Automática IA
              </button>
              <button className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-1.5">
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Class Tabs Utility (Chat, whiteboard, transcripts) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[520px] overflow-hidden">
          
          {/* Tab buttons header */}
          <div className="flex border-b border-slate-100 bg-slate-50 p-2 gap-1">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 text-center py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${activeTab === 'ai' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              IA Transcriptor
            </button>
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex-1 text-center py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${activeTab === 'whiteboard' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Whiteboard
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 text-center py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${activeTab === 'chat' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Chat
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            
            {/* 1. Chat Tab */}
            {activeTab === 'chat' && (
              <div id="classroom-chat" className="flex flex-col h-full justify-between">
                <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className="text-xs space-y-0.5">
                      <div className="flex justify-between text-slate-400 font-medium">
                        <span className="font-bold text-slate-900">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe un mensaje al grupo..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-green focus:bg-white"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-brand-blue hover:bg-brand-blue-light text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}

            {/* 2. Whiteboard Tab */}
            {activeTab === 'whiteboard' && (
              <div id="classroom-whiteboard" className="flex flex-col h-full space-y-4 justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-800">Pizarra Digital Interactiva</span>
                    <button
                      onClick={clearCanvas}
                      className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>Limpiar</span>
                    </button>
                  </div>
                  
                  {/* Drawing Area Canvas */}
                  <canvas
                    ref={canvasRef}
                    width={280}
                    height={260}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="border border-slate-200 rounded-xl cursor-crosshair bg-white shadow-inner block mx-auto"
                  />
                </div>

                {/* Canvas controls */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                  <div className="flex gap-1.5">
                    {['#10b981', '#0a3751', '#f59e0b', '#ef4444', '#000000'].map((col) => (
                      <button
                        key={col}
                        onClick={() => setBrushColor(col)}
                        className={`w-6 h-6 rounded-full border transition-all ${brushColor === col ? 'scale-110 border-slate-600' : 'border-transparent'}`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>

                  {/* Size slider */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Palette className="w-3.5 h-3.5" />
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-16 accent-brand-green cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. AI Transcription Tab */}
            {activeTab === 'ai' && (
              <div id="classroom-ai-transcript" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-green animate-pulse" />
                    <span className="text-xs font-bold text-slate-900">Transcripción y Traducción</span>
                  </div>
                  
                  {/* Lang picker */}
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                    {(['es', 'en', 'fr'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-colors ${selectedLanguage === lang ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {transcripts.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-[11px]">
                      <span className="font-bold text-slate-900 block">{item.speaker}:</span>
                      <p className="text-slate-700 leading-relaxed italic">
                        &quot;{item[selectedLanguage]}&quot;
                      </p>
                    </div>
                  ))}
                </div>

                {/* AI Summary card */}
                <div className="p-3 bg-brand-blue/10 border border-brand-blue-light/20 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-brand-blue font-bold">
                    <FileText className="w-4 h-4 text-brand-green" />
                    <span>Sugerencias de Tutor IA:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px]">{aiSummary}</p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
