import { 
  BookOpen, 
  LayoutDashboard, 
  Video, 
  MessageSquare, 
  TrendingUp, 
  FolderClosed, 
  Settings, 
  LogOut, 
  ShieldAlert
} from "lucide-react";
import { UserRole, UserProfile } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  onChangeRole: (role: UserRole) => void;
  onLogout: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onChangeRole,
  onLogout 
}: SidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['student', 'teacher', 'admin', 'observer'] },
    { id: 'courses', label: 'Mis Cursos', icon: BookOpen, roles: ['student', 'teacher', 'admin', 'observer'] },
    { id: 'classroom', label: 'Aula Virtual', icon: Video, roles: ['student', 'teacher', 'observer'] },
    { id: 'tutor', label: 'Tutor IA 24/7', icon: MessageSquare, roles: ['student', 'observer'] },
    { id: 'analytics', label: 'Analíticas', icon: TrendingUp, roles: ['teacher', 'admin', 'observer'] },
    { id: 'files', label: 'Biblioteca Cloud', icon: FolderClosed, roles: ['student', 'teacher', 'admin'] },
    { id: 'settings', label: 'Perfil y Config.', icon: Settings, roles: ['student', 'teacher', 'admin', 'observer'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(currentUser.role));

  const roleLabels: Record<UserRole, string> = {
    student: 'Estudiante',
    teacher: 'Profesor Titular',
    admin: 'Administrador TI',
    observer: 'Auditor SISALRIL'
  };

  return (
    <aside id="sidebar-container" className="w-72 bg-slate-950 text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 shadow-xl z-20">
      {/* INTECA Brand Header reproducing logo */}
      <div id="sidebar-logo-header" className="p-6 border-b border-slate-800 flex flex-col items-center">
        <div className="flex items-center gap-3">
          <svg className="w-14 h-14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15,50 C15,22 35,10 50,10 C65,10 85,22 85,50" stroke="#0ea5e9" strokeWidth="6" strokeLinecap="round" />
            <path d="M15,50 C15,25 32,15 50,15 C68,15 85,25 85,50" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
            <rect x="10" y="44" width="10" height="20" rx="4" fill="#0284c7" />
            <rect x="80" y="44" width="10" height="20" rx="4" fill="#0284c7" />
            <path d="M32,38 L50,28 L68,38 C68,54 50,72 50,72 C50,72 32,54 32,38 Z" fill="#0f172a" stroke="#0284c7" strokeWidth="4" strokeLinejoin="round" />
            <path d="M45,40 H55 V60 H45 Z" fill="#10b981" />
            <path d="M38,47 H62 V53 H38 Z" fill="#10b981" />
            <path d="M15,62 Q25,78 43,76" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="43" cy="76" r="3" fill="#0284c7" />
          </svg>
          <div className="flex flex-col">
            <span className="font-display font-bold text-2xl tracking-wider text-white">INTECA</span>
            <span className="text-[9px] uppercase tracking-widest text-emerald-500 font-semibold">Campus Virtual</span>
          </div>
        </div>
        <div className="mt-1 text-center">
          <span className="text-[10px] text-slate-400 font-medium">INSTITUTO TÉCNICO DEL CARIBE</span>
        </div>
      </div>

      {/* User Quick Info */}
      <div id="sidebar-user-card" className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
        <img 
          src={currentUser.avatar} 
          alt={currentUser.name} 
          className="w-10 h-10 rounded-full border-2 border-emerald-500 object-cover bg-white" 
        />
        <div className="overflow-hidden">
          <h4 className="font-semibold text-sm truncate text-white">{currentUser.name}</h4>
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
            {roleLabels[currentUser.role]}
          </span>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav id="sidebar-navigation" className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-none">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Interactive Role Switcher in Sidebar Footer */}
      <div id="sidebar-role-switcher-container" className="p-4 mx-4 mb-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Vista de Prueba Académica:</span>
        </div>
        <select
          value={currentUser.role}
          onChange={(e) => onChangeRole(e.target.value as UserRole)}
          className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
        >
          <option value="student">Estudiante</option>
          <option value="teacher">Profesor</option>
          <option value="observer">Auditor / SISALRIL</option>
          <option value="admin">Administrador TI</option>
        </select>
        <p className="text-[10px] text-slate-500 mt-2 leading-tight">
          Cambia de rol para simular accesos en la plataforma.
        </p>
      </div>

      {/* Logout button */}
      <div id="sidebar-footer-logout" className="p-4 border-t border-slate-800 flex items-center justify-between">
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-colors duration-150 text-sm font-medium w-full"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
        <span className="text-[10px] text-slate-600 font-mono">v3.2-IA</span>
      </div>
    </aside>
  );
}