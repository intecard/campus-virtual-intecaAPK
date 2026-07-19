import React from "react";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Bell, 
  GraduationCap, 
  Award, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  Users, 
  Video,
  Building
} from "lucide-react";
import { UserProfile, Course, LiveClass } from "../types";

interface DashboardViewProps {
  currentUser: UserProfile;
  courses: Course[];
  liveClasses: LiveClass[];
  setActiveTab: (tab: string) => void;
}

export default function DashboardView({ 
  currentUser, 
  courses, 
  liveClasses,
  setActiveTab
}: DashboardViewProps) {
  
  const caribbeanTime = new Date().toLocaleTimeString("es-CO", { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Bogota' 
  });

  const caribbeanDate = new Date().toLocaleDateString("es-CO", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const activeClass = liveClasses.find((c: LiveClass) => c.isLive);
  
  // ==========================================
  // CÁLCULOS DINÁMICOS REALES (Empiezan en 0)
  // ==========================================

  // 1. Datos del Estudiante
  const studentCourses = courses; // Aquí mapearemos los cursos en los que el estudiante esté matriculado
  const overallProgress = studentCourses.length > 0 
    ? Math.round(studentCourses.reduce((acc: number, c: Course) => acc + (c.progress || 0), 0) / studentCourses.length) 
    : 0;
  
  // Variables que luego vendrán de Firebase para el estudiante
  const studentAttendance = 0; 
  const studentCredits = 0;
  const studentAiEvals = 0;
  const pendingTasks: any[] = []; // Array vacío hasta que programemos las tareas reales

  // 2. Datos del Profesor
  // Filtramos los cursos donde el profesor asignado sea exactamente el usuario actual
  const teacherCourses = courses.filter((c: Course) => c.teacher === currentUser.name);
  const totalStudentsInCharge = teacherCourses.reduce((acc: number, c: Course) => acc + (c.studentsCount || 0), 0);
  const teacherAverageAttendance = 0; // Empezamos en 0% hasta conectar el módulo de asistencia en vivo


  // ==========================================
  // 1. PANEL DE ESTUDIANTE
  // ==========================================
  const renderStudentDashboard = () => (
    <div id="student-dashboard-layout" className="space-y-6 animate-in fade-in duration-500">
      
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-16 translate-y-16 pointer-events-none">
          <GraduationCap className="w-80 h-80" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold w-fit">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Entorno de Aprendizaje Verificado • Ciclo 2026</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-display font-bold tracking-tight text-white">
              Progreso Académico: {currentUser.name}
            </h1>
            <p className="text-slate-400 max-w-xl text-xs md:text-sm leading-relaxed">
              El motor cognitivo institucional estima un nivel de asimilación óptimo para tus asignaturas. Continúa con tu ruta interactiva.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md min-w-[220px]">
            <Clock className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Zona Horaria Caribe</p>
              <p className="text-xl font-bold font-mono text-white tracking-tight">{caribbeanTime}</p>
              <p className="text-[10px] text-slate-400 capitalize font-medium">{caribbeanDate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Progreso Promedio</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${overallProgress}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Asistencia Verificada</span>
          <span className="text-2xl font-bold text-slate-900 font-mono">{studentAttendance}%</span>
          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">✔ Conforme a HIPAA</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Créditos Acumulados</span>
          <span className="text-2xl font-bold text-sky-600 font-mono">{studentCredits} / 0</span>
          <span className="text-[10px] text-slate-400">Ciclo Técnico Avanzado</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Evaluaciones IA</span>
          <span className="text-2xl font-bold text-slate-900 font-mono">{studentAiEvals}</span>
          <span className="text-[10px] text-sky-500 font-semibold">Buzón Automatizado Activo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-500" />
              <span>Asignaturas en Curso ({studentCourses.length})</span>
            </h2>
            <button onClick={() => setActiveTab('courses')} className="text-xs font-bold text-emerald-600 hover:underline">
              Ver malla curricular →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentCourses.length > 0 ? (
              studentCourses.map((course: Course) => (
                <div 
                  key={course.id} 
                  onClick={() => setActiveTab('courses')}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-500/30 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold uppercase">{course.code}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Prof. {course.teacher}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug">{course.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{course.description}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span className="font-medium">Progreso de Objetivos</span>
                      <span className="font-bold font-mono text-slate-900">{course.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${course.progress || 0}%` }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs font-medium">
                Aún no tienes asignaturas matriculadas.
              </div>
            )}
          </div>

          {currentUser.aiProfile && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 relative overflow-hidden shadow-lg">
              <div className="absolute right-[-20px] bottom-[-20px] opacity-5 pointer-events-none">
                <Sparkles className="w-40 h-48" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">Diagnóstico Cognitivo Asistido</h3>
                  <p className="text-[11px] text-slate-400">Análisis predictivo de la Red Neuronal de INTECA</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[9px] text-emerald-400 uppercase font-mono font-bold tracking-wider block">Estilo Predominante</span>
                  <p className="text-xs font-semibold mt-1 text-slate-200">{currentUser.aiProfile.learningStyle}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[9px] text-emerald-400 uppercase font-mono font-bold tracking-wider block">Rendimiento Estimado</span>
                  <p className="text-xs font-semibold mt-1 text-slate-200">{currentUser.aiProfile.performance}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[9px] text-emerald-400 uppercase font-mono font-bold tracking-wider block">Riesgo Retención</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                    ✔ {currentUser.aiProfile.dropoutRisk}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {activeClass ? (
            <div className="bg-rose-500/5 border-2 border-rose-500/20 p-5 rounded-2xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  Streaming Activo
                </span>
                <span className="text-[10px] text-rose-500 font-bold tracking-wider">● EN TRANSMISIÓN</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm leading-snug">{activeClass.title}</h4>
                <p className="text-xs text-slate-500 font-medium">{activeClass.courseTitle}</p>
              </div>
              <button 
                onClick={() => setActiveTab('classroom')}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-rose-500/10 flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>Ingresar al Aula HD</span>
              </button>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Video className="w-4 h-4 text-slate-400" />
                <span>Transmisión Satelital</span>
              </h3>
              <p className="text-xs text-slate-500 leading-normal">No hay cátedras en vivo transmitiendo en este instante.</p>
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2 font-display">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Buzón de Entregas Pendientes</span>
            </h3>
            
            <div className="space-y-2.5">
              {pendingTasks.length > 0 ? (
                pendingTasks.map((task, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{task.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">Límite: {task.dueDate}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs font-medium">
                  Estás al día. No hay tareas pendientes.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // 2. PANEL DE PROFESOR
  // ==========================================
  const renderTeacherDashboard = () => (
    <div id="teacher-dashboard-layout" className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-slate-700">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
          <Award className="w-80 h-80" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-full text-sky-400 text-xs font-semibold w-fit font-mono uppercase tracking-wider">
              Docente Conectado • Servidor Seguro
            </div>
            <h1 className="text-2xl md:text-4xl font-display font-bold tracking-tight">
              Control de Cátedra: {currentUser.name}
            </h1>
            <p className="text-slate-400 max-w-xl text-xs md:text-sm leading-relaxed">
              Consola unificada para la gestión de notas, monitoreo de asistencia en tiempo real y validación de reportes de corrección generados por el motor de inteligencia artificial.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-white/10 p-5 rounded-2xl text-center min-w-[160px] shadow-inner">
            <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold tracking-wider">Alumnos Regulados</span>
            <span className="text-4xl font-display font-bold text-emerald-400 block mt-1 font-mono tracking-tight">{totalStudentsInCharge}</span>
            <span className="text-[10px] text-slate-500 block mt-1 font-semibold">{teacherCourses.length} Programas Técnicos</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-500" />
              <span>Programas Académicos Asignados ({teacherCourses.length})</span>
            </h2>
            <button onClick={() => setActiveTab('courses')} className="text-xs font-bold text-emerald-600 hover:underline">Gestionar Calificaciones</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teacherCourses.length > 0 ? teacherCourses.map((course: Course) => (
              <div key={course.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[9px] bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded font-bold font-mono uppercase">{course.code}</span>
                    <h3 className="font-bold text-slate-900 leading-snug">{course.title}</h3>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-xl font-bold font-mono whitespace-nowrap">{course.studentsCount || 0} Matrículas</span>
                </div>
              </div>
            )) : (
              <div className="col-span-2 p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-100 font-medium">
                No se registran asignaturas asignadas a tu cuenta de docente en el nodo central.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-950 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Rendimiento Métrico de Cohorte</span>
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium text-slate-600">
                  <span>Asistencia Promedio a Clases en Vivo</span>
                  <span className="font-bold text-slate-900 font-mono">{teacherAverageAttendance}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-600 h-full transition-all duration-1000" style={{ width: `${teacherAverageAttendance}%` }}></div>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('analytics')}
                className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors text-center block font-mono"
              >
                Ver Analíticas Predictivas de Retención
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // 3. PANEL DE AUDITOR / OBSERVADOR
  // ==========================================
  const renderObserverDashboard = () => (
    <div id="observer-dashboard-layout" className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-12 translate-y-12 pointer-events-none">
          <Building className="w-80 h-80" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-xs font-bold w-fit font-mono uppercase tracking-wider">
              Credencial de Fiscalización Activa
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-white">
              Consola de Auditoría Gubernamental
            </h1>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-2xl">
              Acceso transparente habilitado para los representantes oficiales del Colegio Médico, la SISALRIL y el CNSS. Supervise el cumplimiento normativo.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-md min-w-[240px]">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block font-mono font-bold uppercase tracking-wider">Conformidad Curricular</span>
              <span className="text-xl font-bold font-mono text-white">100% Verificado</span>
              <span className="text-[9px] text-slate-500 block font-medium mt-0.5">Estándar HIPAA Activo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-sky-500" />
            <span>Estructura de Programas Técnicos Regulados ({courses.length})</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.length > 0 ? (
              courses.map((course: Course) => (
                <div key={course.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold uppercase">{course.code}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">Aprobado</span>
                    </div>
                    <h3 className="font-bold text-slate-900 leading-snug">{course.title}</h3>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-100 font-medium">
                No hay programas técnicos registrados en la base de datos central actualmente.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // 4. PANEL DE ADMINISTRADOR
  // ==========================================
  const renderAdminDashboard = () => (
    <div id="admin-dashboard-preview" className="text-center p-8 md:p-12 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6 max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm text-sky-600">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">Consola Maestra del Administrador</h2>
        <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-md mx-auto">
          Para realizar operaciones críticas como matriculación de estudiantes, auditoría del registro de actividades o cambios en las políticas de seguridad de la red INTECA.
        </p>
      </div>
      <button 
        onClick={() => setActiveTab('admin')}
        className="bg-slate-900 hover:bg-black text-white text-xs font-bold py-3 px-6 rounded-xl transition-all shadow-md font-mono"
      >
        Abrir Consola de Gestión de Roles
      </button>
    </div>
  );

  return (
    <div id="dashboard-view-root" className="space-y-6">
      <div id="dashboard-header-flex" className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-2">
        <div className="space-y-1">
          <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-widest block">Consola Inteligente</span>
          <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">Panel Integrado de Control</h1>
        </div>
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-100 shadow-sm w-fit">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider font-mono">Nodo Central INTECA En Línea</span>
        </div>
      </div>

      {currentUser.role === 'student' && renderStudentDashboard()}
      {currentUser.role === 'teacher' && renderTeacherDashboard()}
      {currentUser.role === 'observer' && renderObserverDashboard()}
      {currentUser.role === 'admin' && renderAdminDashboard()}
    </div>
  );
}