import { useState } from "react";
import { Bell, Menu, X } from "lucide-react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import CoursesView from "./components/CoursesView";
import VirtualClassroom from "./components/VirtualClassroom";
import AIEducator from "./components/AIEducator";
import AnalyticsView from "./components/AnalyticsView";
import FilesView from "./components/FilesView";
import SettingsView from "./components/SettingsView";
import AuthPage from "./components/AuthPage.";
import AdminView from "./components/AdminView";
import { UserRole, UserProfile, Course, LiveClass } from "./types";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Datos de prueba (Se reemplazarán con datos de Firebase en el DashboardView)
  const [courses, setCourses] = useState<Course[]>([]); 
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleChangeRole = (role: UserRole) => {
    if (!currentUser) return;
    setCurrentUser({ ...currentUser, role });
    setActiveTab("dashboard");
    setIsMobileMenuOpen(false);
  };

  const handleUpdateProfile = (profileData: Partial<UserProfile>) => {
    if (!currentUser) return;
    setCurrentUser({ ...currentUser, ...profileData });
  };

  if (!isAuthenticated || !currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
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
          setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} 
          currentUser={currentUser} 
          onChangeRole={handleChangeRole}
          onLogout={() => setIsAuthenticated(false)}
        />
      </div>

      <main id="main-content-container" className="flex-1 w-full md:ml-72 p-4 md:p-10 min-h-screen relative flex flex-col justify-between overflow-x-hidden overflow-y-auto">
        
        <header id="campus-top-header" className="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">Campus Virtual</span>
              <span className="hidden md:inline text-slate-300">/</span>
              <span className="text-sm font-semibold text-emerald-600 capitalize">{activeTab}</span>
            </div>
          </div>

          <button 
            onClick={() => setShowNotificationCenter(!showNotificationCenter)}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600 relative"
          >
            <Bell className="w-4 h-4" />
          </button>
        </header>

        <div id="active-view-panel-container" className="flex-1 pb-10">
          {activeTab === 'dashboard' && <DashboardView currentUser={currentUser} courses={courses} liveClasses={liveClasses} setActiveTab={setActiveTab} />}
          {activeTab === 'courses' && <CoursesView currentUser={currentUser} courses={courses} setActiveTab={setActiveTab} />}
          {activeTab === 'classroom' && <VirtualClassroom currentUser={currentUser} />}
          {activeTab === 'tutor' && <AIEducator currentUser={currentUser} />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'files' && <FilesView />}
          {activeTab === 'admin' && <AdminView currentUser={currentUser} />}
          {activeTab === 'settings' && <SettingsView currentUser={currentUser} onChangeProfile={handleUpdateProfile} onChangeRole={handleChangeRole} />}
        </div>

        <footer id="campus-institutional-footer" className="mt-auto border-t border-slate-100 pt-4 text-[10px] text-slate-400 text-center md:text-left">
          <p>© 2026 Instituto Técnico del Caribe (INTECA). Auditoría de Seguridad: Zero Trust Activa.</p>
        </footer>
      </main>
    </div>
  );
}