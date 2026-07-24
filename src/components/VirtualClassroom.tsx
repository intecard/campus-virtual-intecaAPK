import React, { useState, useRef, useEffect } from "react";
import {
  Video,
  Tv,
  MessageSquare,
  LogOut,
  Palette,
  Eraser,
  Link as LinkIcon,
  Play,
  Upload,
  Loader2,
  Trash2,
  Plus,
  Disc,
  StopCircle,
  FileVideo,
  CheckCircle2
} from "lucide-react";
import { UserProfile } from "../types";
import { db, storage } from "../firebase"; // <-- Agregamos storage aquí
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // <-- Importaciones de Storage

interface VirtualClassroomProps {
  currentUser: UserProfile;
}

export default function VirtualClassroom({ currentUser }: VirtualClassroomProps) {
  // ==========================================
  // ESTADOS DE LA SALA (LOBBY vs EN LLAMADA)
  // ==========================================
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [activeTab, setActiveTab] = useState<'chat' | 'whiteboard' | 'recordings'>('chat');

  // ==========================================
  // ESTADOS DE FIREBASE (CHAT Y GRABACIONES)
  // ==========================================
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(true);

  // ==========================================
  // ESTADOS DE GRABACIÓN Y SUBIDA DE VIDEO
  // ==========================================
  const [uploadingRecord, setUploadingRecord] = useState(false);
  const [newRecordTitle, setNewRecordTitle] = useState("");
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // ESTADOS DE LA PIZARRA VIRTUAL TÁCTIL
  // ==========================================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#10b981');
  const [brushSize, setBrushSize] = useState(4);

  useEffect(() => {
    const q = query(collection(db, "class_recordings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recs: any[] = [];
      snapshot.forEach(doc => recs.push({ id: doc.id, ...doc.data() }));
      setRecordings(recs);
      setLoadingRecordings(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isInRoom || !roomCode) return;
    
    const q = query(collection(db, `class_chat_${roomCode}`), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      setChatMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsubscribe();
  }, [isInRoom, roomCode]);

  // ==========================================
  // 🛡️ TRUCO MÓVIL Y CONTROL DE SALA
  // ==========================================
  const triggerPermissionsAndJoin = async (code: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.warn("Permisos denegados o hardware no detectado:", err);
    }
    setRoomCode(code);
    setIsInRoom(true);
  };

  const joinRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = roomCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!code) {
      alert("Ingresa un código de sala válido.");
      return;
    }
    triggerPermissionsAndJoin(code);
  };

  const createNewRoom = () => {
    const newCode = Math.random().toString(36).substring(2, 8);
    triggerPermissionsAndJoin(newCode);
  };

  const leaveRoom = () => {
    if (window.confirm("¿Seguro que deseas salir de la clase en vivo?")) {
      setIsInRoom(false);
      setRoomCode("");
      setChatMessages([]);
      if (isRecording) stopRecording(); // Detener grabación si sale de la sala
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !roomCode) return;

    const textToSend = newMessage;
    setNewMessage("");

    try {
      await addDoc(collection(db, `class_chat_${roomCode}`), {
        senderName: currentUser.name,
        senderRole: currentUser.role,
        text: textToSend,
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error enviando mensaje:", error);
    }
  };

  // ==========================================
  // NUEVO: FUNCIONES DE GRABACIÓN DE PANTALLA
  // ==========================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `Clase_Grabada_${Date.now()}.webm`, { type: 'video/webm' });
        setSelectedVideoFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
    } catch (err) {
      console.error("Error al iniciar grabación:", err);
      alert("No se pudo iniciar la grabación. Verifica los permisos de tu navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // ==========================================
  // NUEVO: FUNCIONES DE SUBIDA DE VIDEO A STORAGE
  // ==========================================
  const handleUploadRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordTitle || !selectedVideoFile) return;

    setUploadingRecord(true);
    
    try {
      const storageRef = ref(storage, `class_recordings/${Date.now()}_${selectedVideoFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, selectedVideoFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Error subiendo archivo:", error);
          alert("Error al subir el video.");
          setUploadingRecord(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          await addDoc(collection(db, "class_recordings"), {
            title: newRecordTitle,
            url: downloadURL,
            uploadedBy: currentUser.name,
            dateString: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
            createdAt: serverTimestamp()
          });

          setNewRecordTitle("");
          setSelectedVideoFile(null);
          setUploadProgress(0);
          alert("Grabación guardada y publicada exitosamente.");
          setUploadingRecord(false);
        }
      );
    } catch (error) {
      console.error("Error guardando grabación:", error);
      alert("Error inesperado al guardar la grabación.");
      setUploadingRecord(false);
    }
  };

  const handleDeleteRecording = async (id: string) => {
    if (window.confirm("¿Eliminar esta grabación de la plataforma?")) {
      await deleteDoc(doc(db, "class_recordings", id));
    }
  };

  // ==========================================
  // FUNCIONES DE PIZARRA
  // ==========================================
  useEffect(() => {
    if (activeTab === 'whiteboard' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [activeTab]);

  const getCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e.clientX, e.clientY);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e.clientX, e.clientY);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const touch = e.touches[0];
    const { x, y } = getCoordinates(touch.clientX, touch.clientY);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    setIsDrawing(true);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const touch = e.touches[0];
    const { x, y } = getCoordinates(touch.clientX, touch.clientY);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // ==========================================
  // RENDER 1: LOBBY
  // ==========================================
  if (!isInRoom) {
    return (
      <div id="virtual-classroom-lobby" className="space-y-6 animate-in fade-in duration-500 pb-10">
        <div>
          <span className="text-xs font-mono font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
            Centro de Videoconferencias HD
          </span>
          <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">Aula Virtual INTECA Live</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="w-16 h-16 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center mb-4">
              <Video className="w-8 h-8" />
            </div>

            {currentUser.role !== 'teacher' ? (
              <>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Ingresar a una Clase</h2>
                  <p className="text-sm text-slate-500 mt-1">Ingresa el código proporcionado por tu profesor o crea una nueva sala instantánea.</p>
                </div>
                <form onSubmit={joinRoom} className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Código de la Sala / Link:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        placeholder="Ej. farma101"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md">
                        Unirse
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-slate-900">Transmitir una Clase</h2>
                <p className="text-sm text-slate-500 mt-1">Como profesor titular, inicia una nueva sala en vivo instantánea y comparte el código con tus alumnos para que ingresen.</p>
              </div>
            )}

            {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
              <div className={currentUser.role !== 'teacher' ? "pt-4 border-t border-slate-100" : "pt-2"}>
                <button
                  onClick={createNewRoom}
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Iniciar Nueva Clase en Vivo
                </button>
              </div>
            )}
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col h-[450px]">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tv className="w-5 h-5 text-emerald-500" /> Archivo de Grabaciones
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
              {loadingRecordings ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-xs font-mono font-bold uppercase tracking-wider">Cargando archivo...</p>
                </div>
              ) : recordings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <Tv className="w-12 h-12 text-slate-200" />
                  <p className="text-sm font-bold text-slate-600">No hay clases grabadas</p>
                  <p className="text-xs text-center">Las clases guardadas por los profesores aparecerán aquí.</p>
                </div>
              ) : (
                recordings.map((rec) => (
                  <div key={rec.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-3 group hover:border-emerald-500/30 transition-all">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-snug">{rec.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">Por: {rec.uploadedBy} • {rec.dateString}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <a
                        href={rec.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3 h-3" /> Ver Grabación
                      </a>
                      {(currentUser.role === 'admin' || currentUser.name === rec.uploadedBy) && (
                        <button
                          onClick={() => handleDeleteRecording(rec.id)}
                          className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors"
                          title="Eliminar grabación"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 2: SALA ACTIVA
  // ==========================================
  return (
    <div id="virtual-classroom-active" className="space-y-4 md:space-y-6 animate-in zoom-in-95 duration-500 h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header de la Sala Activa */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-900 p-4 rounded-2xl text-white shadow-lg shrink-0">
        <div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            En Transmisión • Sala Segura
          </span>
          <h1 className="text-lg md:text-xl font-display font-bold text-white mt-0.5">Clase en Vivo</h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 font-mono text-sm font-bold flex-1 md:flex-none text-center">
            Código: <span className="text-emerald-400">{roomCode}</span>
          </div>
          <button
            onClick={leaveRoom}
            className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-3 md:px-4 rounded-xl transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir de la Clase</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        
        {/* ÁREA DE VIDEO - JITSI INTEGRADO */}
        <div className="w-full lg:w-2/3 bg-black rounded-2xl md:rounded-3xl overflow-hidden border border-slate-800 shadow-xl flex flex-col relative h-[35vh] md:h-[50vh] lg:h-auto shrink-0">
          <iframe
            allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
            src={`https://meet.ffmuc.net/inteca_campus_${roomCode}#userInfo.displayName="${encodeURIComponent(currentUser.name)}"&config.disableDeepLinking=true&config.prejoinPageEnabled=false`}
            className="w-full h-full border-0 absolute inset-0"
            title="Video Classroom INTECA"
          />
        </div>

        {/* ÁREA DE HERRAMIENTAS */}
        <div className="w-full lg:w-1/3 bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex flex-col flex-1 min-h-[40vh] overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50 p-2 gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${activeTab === 'chat' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat Live
            </button>
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${activeTab === 'whiteboard' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Palette className="w-3.5 h-3.5" /> Pizarra
            </button>
            <button
              onClick={() => setActiveTab('recordings')}
              className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${activeTab === 'recordings' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Tv className="w-3.5 h-3.5" /> Grabar
            </button>
          </div>

          <div className="flex-1 p-3 md:p-4 overflow-y-auto relative bg-slate-50/30">
            
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full absolute inset-0 p-3 md:p-4">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none pb-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 opacity-60">
                      <MessageSquare className="w-8 h-8" />
                      <p className="text-xs font-bold">No hay mensajes aún.</p>
                      <p className="text-[10px]">Escribe el primero en esta sala.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      const isMe = msg.senderName === currentUser.name;
                      return (
                        <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-0.5`}>
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-[11px] text-slate-700">{msg.senderName}</span>
                            <span className="text-[9px] text-slate-400">{msg.timeString}</span>
                          </div>
                          <div className={`p-2.5 rounded-2xl text-xs leading-relaxed max-w-[85%] break-words ${isMe ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 md:pt-3 border-t border-slate-200 shrink-0 bg-white p-1 rounded-xl">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe y envía emojis..."
                    className="flex-1 bg-transparent border-none px-3 py-1 text-sm focus:outline-none focus:ring-0 text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white p-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'whiteboard' && (
              <div className="flex flex-col h-full space-y-3 justify-between absolute inset-0 p-3 md:p-4">
                <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider pl-2">Pizarra Local</span>
                  <button
                    onClick={clearCanvas}
                    className="text-[10px] bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-colors"
                  >
                    <Eraser className="w-3.5 h-3.5" /> Limpiar
                  </button>
                </div>
                
                <div className="flex-1 border-2 border-slate-200 rounded-2xl overflow-hidden bg-white shadow-inner relative">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={800}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawingTouch}
                    onTouchMove={drawTouch}
                    onTouchEnd={stopDrawing}
                    onTouchCancel={stopDrawing}
                    className="cursor-crosshair w-full h-full touch-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>

                <div className="flex flex-wrap justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0 gap-2">
                  <div className="flex gap-2">
                    {['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#0f172a'].map((col) => (
                      <button
                        key={col}
                        onClick={() => setBrushColor(col)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${brushColor === col ? 'scale-110 border-slate-400 shadow-md' : 'border-transparent'}`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg w-full sm:w-auto">
                    <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full sm:w-16 accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NUEVA PESTAÑA DE GRABACIONES ACTUALIZADA */}
            {activeTab === 'recordings' && (
              <div className="flex flex-col h-full absolute inset-0 p-3 md:p-4 space-y-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-3 shrink-0">
                  <h3 className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                    <Tv className="w-4 h-4" /> Opciones de Grabación
                  </h3>
                  <div className="flex gap-2">
                    {!isRecording ? (
                      <button 
                        onClick={startRecording}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <Disc className="w-4 h-4" /> Grabar Pantalla
                      </button>
                    ) : (
                      <button 
                        onClick={stopRecording}
                        className="flex-1 bg-slate-900 hover:bg-black text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all animate-pulse shadow-sm"
                      >
                        <StopCircle className="w-4 h-4 text-red-500" /> Finalizar Grabación
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-emerald-600 leading-relaxed font-medium">
                    {isRecording ? "Grabando pantalla en este momento..." : "Puedes grabar la clase en vivo, o subir un video desde tus archivos para el archivo general."}
                  </p>
                </div>
                
                <form onSubmit={handleUploadRecording} className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título de la Clase</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Unidad 1: Actualidades..."
                      value={newRecordTitle}
                      onChange={e => setNewRecordTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Archivo de Video</label>
                    <div className="relative flex-1 min-h-[100px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setSelectedVideoFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      
                      {selectedVideoFile ? (
                        <div className="flex flex-col items-center text-emerald-600 gap-2 text-center pointer-events-none">
                          <CheckCircle2 className="w-8 h-8" />
                          <span className="text-xs font-bold break-words max-w-[200px]">{selectedVideoFile.name}</span>
                          <span className="text-[10px] text-slate-500">{(selectedVideoFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 group-hover:text-emerald-500 gap-2 pointer-events-none">
                          <FileVideo className="w-8 h-8" />
                          <span className="text-xs font-bold text-center">Toca para seleccionar<br/>o graba un video arriba</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {uploadingRecord && (
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploadingRecord || !newRecordTitle || !selectedVideoFile}
                    className="w-full bg-slate-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-md mt-auto shrink-0"
                  >
                    {uploadingRecord ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Subiendo ({Math.round(uploadProgress)}%)
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Subir a la Base de Datos
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}