import { useState } from "react";
import { 
  Bell, 
  Sparkles, 
  Menu,
  X
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import CoursesView from "./components/CoursesView";
import VirtualClassroom from "./components/VirtualClassroom";
import AIEducator from "./components/AIEducator";
import AnalyticsView from "./components/AnalyticsView";
import FilesView from "./components/FilesView";
import SettingsView from "./components/SettingsView";
import LoginView from "./components/LoginView";
import { UserRole, UserProfile, Course, LiveClass } from "./types";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 🔒 Estado de seguridad
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [notifications, setNotifications] = useState([
    { id: "n1", text: "Nueva clase en vivo de Telemedicina transmitiendo ahora.", unread: true },
    { id: "n2", text: "Tu ensayo de Ciberseguridad ha sido evaluado por IA.", unread: true },
    { id: "n3", text: "Coordinador de Redes actualizó el Syllabus unificado.", unread: false }
  ]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Personalized student account matching user metadata
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: "u_luis",
    name: "Luis Ramírez Escalante",
    email: "luisramirezescalante20@gmail.com",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200", 
    academicId: "INTECA-2026-9481",
    joinedDate: "Feb 2026",
    progress: 74,
    attendanceRate: 98.4,
    averageGrade: 88.5,
    aiProfile: {
      performance: "Sobresaliente (Ruta Acelerada)",
      behavior: "Participativo, enfocado en teleasistencia y protocolos de comunicación",
      learningStyle: "Práctico y Visual con alta asimilación de laboratorios interactivos",
      strengths: ["Cifrado simétrico AES", "Triaje de telemedicina rural", "OSPF multipath"],
      weaknesses: ["Mitigación de inundaciones SYN flood", "Sincronización SCORM síncrona"],
      dropoutRisk: "Bajo",
      studyPlan: [
        "Completar Laboratorio 4 de Enrutamiento antes del viernes.",
        "Consultar a INTECA Intellect sobre modulación de frecuencias paramédicas.",
        "Revisar el material PDF de Ciberseguridad sobre enclaves criptográficos."
      ]
    }
  });

  // Caribbean Technical Institute Course List
  const [courses, setCourses] = useState<Course[]>([
    {
      id: "c_telemedicina",
      title: "Fundamentos de Telemedicina y Paramédicos",
      code: "TMP-101",
      description: "Protocolos de soporte clínico inmediato, enrutamiento seguro de señales electrocardiográficas (ECG) y triaje paramédico asistido por video en el Caribe rural.",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600",
      teacher: "Carlos Mendoza",
      progress: 82,
      studentsCount: 42,
      schedule: "Lunes y Miércoles 10:00 AM",
      category: "Salud y Emergencia",
      modules: [
        {
          id: "m_tele_1",
          title: "Módulo 1: Introducción a la Teleasistencia Clínica",
          description: "Estándares de comunicación remota de emergencia, directrices HIPAA y soporte de vida.",
          lessons: [
            { id: "l_tele_1_1", title: "Video: Introducción al Soporte Clínico Satelital", description: "Conceptos de transmisión HD de audio e indicaciones médicas.", duration: "12 min", type: "video", contentUrl: "#" },
            { id: "l_tele_1_2", title: "Manual PDF: Estándares HIPAA en el Caribe", description: "Guías oficiales de encriptación y resguardo de datos médicos.", duration: "18 pág", type: "pdf", contentUrl: "#" }
          ]
        },
        {
          id: "m_tele_2",
          title: "Módulo 2: Simulación de Triaje por Video HD",
          description: "Manejo interactivo de pacientes críticos y envío de parámetros telemétricos.",
          lessons: [
            { id: "l_tele_2_1", title: "Práctica: Transmisión de ECG Rural", description: "Configuración de enrutamiento continuo de ondas cardíacas.", duration: "25 min", type: "document", contentUrl: "#" },
            { id: "l_tele_2_2", title: "Evaluación IA: Simulacro de Triaje de Emergencia", description: "Examen interactivo con preguntas generadas dinámicamente por la IA.", duration: "10 min", type: "quiz", contentUrl: "#" }
          ]
        }
      ]
    },
    {
      id: "c_ciberseguridad",
      title: "Ciberseguridad e Infraestructura Crítica",
      code: "CS-202",
      description: "Seguridad defensiva en redes de salud y telecomunicación. Aplicación del principio Zero Trust (Confianza Cero), mitigación de ransomware y aislamiento de enclaves.",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600",
      teacher: "Martha Reyes",
      progress: 68,
      studentsCount: 58,
      schedule: "Martes y Jueves 02:00 PM",
      category: "Seguridad y Redes",
      modules: [
        {
          id: "m_cyber_1",
          title: "Módulo 1: Arquitectura de Red Zero Trust",
          description: "Modelos de autenticación de múltiples capas y segmentación de subredes para datos confidenciales.",
          lessons: [
            { id: "l_cyber_1_1", title: "Video: Control de Accesos Perimetrales", description: "Demostración práctica de cortafuegos de siguiente generación.", duration: "15 min", type: "video", contentUrl: "#" },
            { id: "l_cyber_1_2", title: "Guía PDF: Mitigación de Ransomware Clínico", description: "Protocolos de aislamiento de hosts infectados de forma autónoma.", duration: "12 pág", type: "pdf", contentUrl: "#" }
          ]
        },
        {
          id: "m_cyber_2",
          title: "Módulo 2: Cifrado IPsec y Canales Seguros",
          description: "Diseño e implementación de túneles virtuales con encriptación AES-256.",
          lessons: [
            { id: "l_cyber_2_1", title: "Práctica: Configuración de VPN Seguras", description: "Esquema práctico de enrutamiento en enclaves críticos.", duration: "30 min", type: "document", contentUrl: "#" },
            { id: "l_cyber_2_2", title: "Evaluación IA: Examen de Seguridad Perimetral", description: "Quiz adaptativo sobre mitigación de incidentes.", duration: "12 min", type: "quiz", contentUrl: "#" }
          ]
        }
      ]
    },
    {
      id: "c_redes",
      title: "Redes y Telecomunicaciones Inteligentes",
      code: "TEL-303",
      description: "Diseño, administración y optimización de redes multiplexadas en zonas rurales del Caribe. Redundancia de microondas y fibra óptica asistida por algoritmos.",
      image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=600",
      teacher: "Carlos Mendoza",
      progress: 72,
      studentsCount: 42,
      schedule: "Viernes 09:00 AM",
      category: "Telecomunicaciones",
      modules: [
        {
          id: "m_net_1",
          title: "Módulo 1: Enrutamiento Dinámico e IPsec",
          description: "Estudio profundo de los protocolos OSPF, BGP y conmutación rápida de enlaces satelitales.",
          lessons: [
            { id: "l_net_1_1", title: "Manual: Direccionamiento IP Multiplexado", description: "Planificación de subredes para instituciones complejas.", duration: "22 pág", type: "pdf", contentUrl: "#" },
            { id: "l_net_1_2", title: "Evaluación IA: Diagnóstico de Enrutamiento OSPF", description: "Quiz interactivo sobre convergencia y latencia en enlaces satelitales.", duration: "10 min", type: "quiz", contentUrl: "#" }
          ]
        }
      ]
    }
  ]);

  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([
    {
      id: "class_1",
      title: "Clase Práctica: Simulación de Triaje Paramédico Rural por Video HD",
      courseId: "c_telemedicina",
      courseTitle: "Fundamentos de Telemedicina y Paramédicos",
      teacher: "Carlos Mendoza",
      startTime: "Transmitiendo Ahora",
      duration: "1 hora",
      isLive: true,
      meetingId: "tmp-101-live-meet"
    }
  ]);

  const handleChangeRole = (role: UserRole) => {
    const roleAvatars: Record<UserRole, string> = {
      student: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      teacher: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
      admin: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
      parent: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      role,
      name: role === 'student' ? "Luis Ramírez Escalante" : role === 'teacher' ? "Prof. Carlos Mendoza" : role === 'admin' ? "Ing. Diana Guerrero (Admin)" : "Felipe Ramírez (Padre)",
      avatar: roleAvatars[role],
      academicId: role === 'student' ? "INTECA-2026-9481" : role === 'teacher' ? "INTECA-DOC-4281" : role === 'admin' ? "INTECA-ADM-001" : "INTECA-PAR-5582"
    };

    setCurrentUser(updatedUser);
    setActiveTab("dashboard");
    setIsMobileMenuOpen(false); 
  };

  const handleUpdateProfile = (profileData: Partial<UserProfile>) => {
    setCurrentUser(prev => ({
      ...prev,
      ...profileData
    }));
  };

  const handleGradeHomework = async (courseId: string, taskTitle: string, submittedText: string) => {
    try {
      const res = await fetch("/api/homework/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: currentUser.name,
          taskTitle,
          submittedText
        })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Failed to fetch homework grading:", err);
      throw err;
    }
  };

  const clearUnreadNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <>
      {!isAuthenticated ? (
        <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />
      ) : (
        <div id="campus-app-layout" className="min-h-screen bg-slate-50 text-slate-800 flex font-sans overflow-hidden">
          
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          <div className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:fixed transition-transform duration-300 ease-in-out`}>
            <Sidebar 
              activeTab={activeTab} 
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setIsMobileMenuOpen(false);
              }} 
              currentUser={currentUser} 
              onChangeRole={handleChangeRole}
              onLogout={() => {
                setIsAuthenticated(false); // Cierra sesión y devuelve al Login
              }}
            />
          </div>

          <main id="main-content-container" className="flex-1 w-full md:ml-72 p-4 md:p-10 min-h-screen relative flex flex-col justify-between overflow-x-hidden overflow-y-auto">
            
            <header id="campus-top-header" className="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-100 pb-4 shrink-0 mt-2 md:mt-0">
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="hidden md:inline text-xs font-bold text-slate-400 font-mono tracking-widest uppercase">Campus Virtual</span>
                  <span className="hidden md:inline text-slate-300">/</span>
                  <span className="text-sm md:text-xs font-semibold text-brand-green capitalize">{activeTab}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 relative">
                
                {currentUser.role === 'student' && (
                  <div className="hidden lg:flex items-center gap-3 bg-brand-green/10 border border-brand-green/20 px-3.5 py-1.5 rounded-xl">
                    <Sparkles className="w-4 h-4 text-brand-green" />
                    <span className="text-[11px] font-bold text-slate-700">Racha de estudio: <strong className="text-brand-green">14 Días 🔥</strong></span>
                  </div>
                )}

                <button 
                  onClick={() => {
                    setShowNotificationCenter(!showNotificationCenter);
                    if (!showNotificationCenter) clearUnreadNotifications();
                  }}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600 relative shrink-0"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-bounce"></span>
                  )}
                </button>

                {showNotificationCenter && (
                  <div className="absolute right-0 top-12 bg-white rounded-2xl border border-slate-100 shadow-xl p-4 w-72 md:w-80 z-30 space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="text-xs font-bold text-slate-900">Notificaciones</h4>
                      <button onClick={() => setShowNotificationCenter(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {notifications.map((not) => (
                        <div key={not.id} className={`p-2.5 rounded-xl text-[11px] leading-relaxed border ${not.unread ? 'bg-brand-green/10 border-brand-green/20 font-medium text-slate-800' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                          {not.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </header>

            <div id="active-view-panel-container" className="flex-1 pb-10">
              {activeTab === 'dashboard' && (
                <DashboardView 
                  currentUser={currentUser} 
                  courses={courses} 
                  liveClasses={liveClasses}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'courses' && (
                <CoursesView 
                  currentUser={currentUser} 
                  courses={courses} 
                  setActiveTab={setActiveTab}
                  onGradeHomework={handleGradeHomework}
                />
              )}

              {activeTab === 'classroom' && (
                <VirtualClassroom currentUser={currentUser} />
              )}

              {activeTab === 'tutor' && (
                <AIEducator currentUser={currentUser} />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView />
              )}

              {activeTab === 'files' && (
                <FilesView />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  currentUser={currentUser} 
                  onChangeProfile={handleUpdateProfile}
                  onChangeRole={handleChangeRole}
                />
              )}
            </div>

            <footer id="campus-institutional-footer" className="mt-auto border-t border-slate-100 pt-4 flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] text-slate-400 shrink-0 text-center md:text-left">
              <p>© 2026 Instituto Técnico del Caribe (INTECA). Todos los derechos reservados.</p>
              <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                <a href="#" onClick={(e) => { e.preventDefault(); alert("Auditoría de privacidad conforme a HIPAA / GDPR activa."); }} className="hover:underline">Privacidad</a>
                <span className="hidden md:inline text-slate-200">|</span>
                <a href="#" onClick={(e) => { e.preventDefault(); alert("Contacto: soporte@inteca.edu.co"); }} className="hover:underline">Soporte LMS</a>
              </div>
            </footer>

          </main>
        </div>
      )}
    </>
  );
}