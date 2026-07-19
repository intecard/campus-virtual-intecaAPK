import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Sparkles, 
  X,
  Loader2,
  Menu
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import CoursesView from "./components/CoursesView";
import VirtualClassroom from "./components/VirtualClassroom";
import AIEducator from "./components/AIEducator";
import AnalyticsView from "./components/AnalyticsView";
import FilesView from "./components/FilesView";
import SettingsView from "./components/SettingsView";
import AdminView from "./components/AdminView";
import AuthPage from "./components/AuthPage";
import { UserProfile, Course, LiveClass } from "./types";

// Firebase Imports
import { auth, db, seedInitialDatabaseIfEmpty, getUserProfile, createUserProfile, updateUserProfileInDB, logUserActivity } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  const [liveClasses] = useState<LiveClass[]>([
    {
      id: "class_1",
      title: "Clase Práctica: Reconocimiento de Principios Activos y Medicamentos de Control",
      courseId: "c_farmacologia",
      courseTitle: "Farmacología Aplicada para Visitadores Médicos",
      teacher: "Carlos Mendoza",
      startTime: "Transmitiendo Ahora",
      duration: "1 hora",
      isLive: true,
      meetingId: "far-101-live-meet"
    }
  ]);

  useEffect(() => {
    const initializeAppAndAuth = async () => {
      try {
        await seedInitialDatabaseIfEmpty();
      } catch (err) {
        console.error("Failed to seed database during launch:", err);
      }

      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            let profile = await getUserProfile(firebaseUser.uid);
            if (!profile) {
              profile = await createUserProfile(firebaseUser.uid, {
                name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Estudiante INTECA",
                email: firebaseUser.email || "",
                role: "student",
                avatar: firebaseUser.photoURL || undefined
              });
            }
            setCurrentUser(profile);
          } catch (err) {
            console.error("Error retrieving user profile from Firestore:", err);
          }
        } else {
          setCurrentUser(null);
        }
        setAuthLoading(false);
      });

      return unsubscribeAuth;
    };

    let unsub: any;
    initializeAppAndAuth().then(u => unsub = u);

    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const loadCourses = async () => {
      try {
        const coursesCol = collection(db, "courses");
        const coursesSnap = await getDocs(coursesCol);
        const coursesList: Course[] = [];
        coursesSnap.forEach((docSnap) => {
          coursesList.push({ id: docSnap.id, ...docSnap.data() } as Course);
        });
        setCourses(coursesList);
      } catch (err) {
        console.error("Error fetching courses from Firestore:", err);
      }
    };
    loadCourses();

    const q = query(collection(db, "notifications"), orderBy("timestamp", "desc"));
    const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === "all" || data.userId === currentUser.id) {
          list.push({
            id: docSnap.id,
            text: data.text,
            unread: data.unread ?? true
          });
        }
      });
      setNotifications(list);
    }, (err) => {
      console.error("Notifications real-time listener failed:", err);
    });

    return () => {
      unsubscribeNotifications();
    };
  }, [currentUser]);

  const handleUpdateProfile = async (profileData: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      await updateUserProfileInDB(currentUser.id, profileData);
      
      await logUserActivity(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        currentUser.role,
        "PROFILE_UPDATE",
        `Modificó datos personales en la configuración de su cuenta escolar.`
      );

      setCurrentUser((prev: UserProfile | null) => prev ? ({ ...prev, ...profileData }) : null);
    } catch (err) {
      console.error("Failed to update profile in Firestore:", err);
    }
  };

  const handleGradeHomework = async (courseId: string, taskTitle: string, submittedText: string) => {
    try {
      const res = await fetch("/api/homework/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: currentUser?.name || "Estudiante",
          taskTitle,
          submittedText
        })
      });
      const data = await res.json();
      
      if (currentUser) {
        await logUserActivity(
          currentUser.id,
          currentUser.name,
          currentUser.email,
          currentUser.role,
          "AI_GRADING",
          `Entregó tarea "${taskTitle}" para evaluación inmediata de IA (Puntaje obtenido: ${data.feedback?.score || 0}/100)`
        );
      }
      return data;
    } catch (err) {
      console.error("Failed to fetch homework grading:", err);
      throw err;
    }
  };

  const handleLogout = async () => {
    if (!currentUser) return;
    try {
      await logUserActivity(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        currentUser.role,
        "LOGOUT",
        "Cierre de sesión seguro y exitoso"
      );
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const clearUnreadNotifications = async () => {
    setNotifications((prev: any[]) => prev.map((n: any) => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter((n: any) => n.unread).length;

  if (authLoading) {
    return (
      <div id="auth-loading-splash" className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
        <div className="text-center">
          <h2 className="text-sm font-bold tracking-wider text-white uppercase font-mono">Verificando Sesión Escolar</h2>
          <p className="text-xs text-slate-400 mt-1">Negociación de credenciales seguras de INTECA...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onAuthSuccess={(profile: any) => setCurrentUser(profile)} />;
  }

  return (
    <div id="campus-app-layout" className="h-screen w-full bg-slate-50 text-slate-800 flex font-sans overflow-hidden">
      
      {/* Backdrop oscuro para móvil (Overlay). Cierra el menú al tocar afuera. Z-40 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Menú lateral liberado de su div contenedor para usar sus propias animaciones y recibiendo el estado isOpen */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentUser={currentUser} 
        onLogout={handleLogout}
        onClose={() => setSidebarOpen(false)}
        isOpen={sidebarOpen}
      />

      {/* Main Content Area: Se le agregó lg:ml-72 para que en PC deje el espacio del Sidebar y no quede por debajo */}
      <main id="main-content-container" className="flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 relative flex flex-col justify-between lg:ml-72 transition-all duration-300">
        
        {/* Persistent Top Header */}
        <header id="campus-top-header" className="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-100 pb-4 shrink-0 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shrink-0"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="text-[10px] md:text-xs font-bold text-slate-400 font-mono tracking-widest uppercase">Campus Virtual</span>
              <span className="text-slate-300">/</span>
              <span className="text-[10px] md:text-xs font-semibold text-emerald-500 capitalize">{activeTab === 'admin' ? 'Auditoría y Roles' : activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {currentUser.role === 'student' && (
              <div className="hidden md:flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px] font-bold text-slate-700">Racha de estudio: <strong className="text-emerald-500">14 Días 🔥</strong></span>
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
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-bounce"></span>
              )}
            </button>

            {showNotificationCenter && (
              <div className="absolute right-0 top-12 bg-white rounded-2xl border border-slate-100 shadow-xl p-4 w-80 z-30 space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-xs font-bold text-slate-900">Centro de Notificaciones</h4>
                  <button onClick={() => setShowNotificationCenter(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-4">No tiene notificaciones recientes.</p>
                  ) : (
                    notifications.map((not) => (
                      <div key={not.id} className={`p-2.5 rounded-xl text-[11px] leading-relaxed border ${not.unread ? 'bg-emerald-500/10 border-emerald-500/20 font-semibold text-slate-800' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                        {not.text}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* View switching panel wrapper */}
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

          {activeTab === 'admin' && (
            <AdminView currentUser={currentUser} />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              currentUser={currentUser} 
              onChangeProfile={handleUpdateProfile}
              // El rol ya no se puede cambiar desde la configuración
            />
          )}
        </div>

        {/* Institutional Footer */}
        <footer id="campus-institutional-footer" className="mt-auto border-t border-slate-100 pt-4 flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] text-slate-400 shrink-0">
          <p>© 2026 Instituto Técnico del Caribe (INTECA). Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Auditoría de privacidad conforme a HIPAA / GDPR activa."); }} className="hover:underline">Políticas de Privacidad</a>
            <span className="text-slate-200">|</span>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Contacto: soporte@inteca.edu.do"); }} className="hover:underline">Soporte LMS</a>
          </div>
        </footer>

      </main>
    </div>
  );
}