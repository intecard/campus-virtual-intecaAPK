import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Bell, 
  User, 
  GraduationCap, 
  Award, 
  Sparkles, 
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  FileText,
  MessageSquare,
  Users,
  Video
} from "lucide-react";
import { UserRole, UserProfile, Course, LiveClass } from "../types";

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
    timeZone: 'America/Bogota' // Caribbean aligned timezone (e.g., Cartagena, Caribbean Colombia / Caribbean Islands)
  });

  const caribbeanDate = new Date().toLocaleDateString("es-CO", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate some stats
  const enrolledCoursesCount = courses.length;
  const overallProgress = Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / (courses.length || 1));
  const activeClass = liveClasses.find(c => c.isLive);

  // Student Dashboard
  const renderStudentDashboard = () => (
    <div id="student-dashboard" className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-dark rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-brand-blue-light/30">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
          <GraduationCap className="w-96 h-96" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-brand-green/20 border border-brand-green/40 px-3 py-1 rounded-full text-brand-green text-xs font-semibold w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Virtual Activo • Ciclo Académico 2026</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
              ¡Hola de nuevo, {currentUser.name}!
            </h1>
            <p className="text-slate-300 max-w-xl text-sm md:text-base leading-relaxed">
              Tu asistente cognitivo <strong className="text-brand-green">INTECA Intellect</strong> estima que estás rindiendo al <strong className="text-white">94%</strong> de tu potencial. Sigue así.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-brand-blue-light/30 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <Clock className="w-10 h-10 text-brand-green" />
            <div>
              <p className="text-xs text-slate-300 font-mono tracking-widest uppercase">Hora del Caribe</p>
              <p className="text-2xl font-bold font-mono text-white">{caribbeanTime}</p>
              <p className="text-[10px] text-slate-400 capitalize">{caribbeanDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Enrolled Courses & Progress */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-blue" />
              <span>Mis Materias Inscritas</span>
            </h2>
            <button 
              onClick={() => setActiveTab('courses')}
              className="text-xs text-brand-green hover:text-brand-green-hover font-semibold transition-colors"
            >
              Ver todas →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div 
                key={course.id} 
                onClick={() => setActiveTab('courses')}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-brand-green/30 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono uppercase font-bold">{course.code}</span>
                  <h3 className="font-bold text-slate-900 mt-2 group-hover:text-brand-blue transition-colors leading-snug">{course.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Progreso del Curso</span>
                    <span className="font-semibold">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-green h-full rounded-full transition-all duration-500" 
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Student Profile Card */}
          {currentUser.aiProfile && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-brand-blue-light/50 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-5">
                <Sparkles className="w-48 h-48" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-brand-green/20 rounded-xl border border-brand-green/40">
                  <Sparkles className="w-5 h-5 text-brand-green" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">Perfil del Alumno por INTECA Intellect</h3>
                  <p className="text-xs text-slate-400">Análisis continuo de rendimiento y hábitos de estudio con IA</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-brand-green uppercase tracking-wider font-bold">Estilo de Aprendizaje</span>
                  <p className="text-sm font-semibold mt-1 text-white">{currentUser.aiProfile.learningStyle}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-brand-green uppercase tracking-wider font-bold">Nivel de Desempeño</span>
                  <p className="text-sm font-semibold mt-1 text-white">{currentUser.aiProfile.performance}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-brand-green uppercase tracking-wider font-bold">Riesgo de Abandono</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold mt-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {currentUser.aiProfile.dropoutRisk}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ruta Recomendada por IA:</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentUser.aiProfile.studyPlan.map((step, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-brand-green mt-0.5">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right column: schedule, tasks & active live classes */}
        <div className="space-y-6">
          {/* Active Live Class Card */}
          {activeClass ? (
            <div className="bg-rose-500/10 border-2 border-rose-500/20 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  Clase en Vivo
                </span>
                <span className="text-xs text-rose-500 font-semibold pulse-indicator">● TRANSMITIENDO</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">{activeClass.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{activeClass.courseTitle} • Prof. {activeClass.teacher}</p>
              </div>
              <button 
                onClick={() => setActiveTab('classroom')}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>Unirse al Salón HD</span>
              </button>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-slate-400" />
                <span>Salón Virtual</span>
              </h3>
              <p className="text-xs text-slate-500">No hay transmisiones activas en este instante. Próxima clase hoy a las 15:00.</p>
            </div>
          )}

          {/* Pending Tasks */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-950 font-display flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-green" />
              <span>Tareas Pendientes</span>
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Lab: Simulación de Triaje Remoto</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Vence: Mañana, 23:59</p>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">Urgente</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Análisis: Red VPN IPsec en Salud</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Vence: En 3 días</p>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">Abierto</span>
              </div>
            </div>
          </div>

          {/* Academic Calendar Widget */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-950 font-display flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-blue" />
              <span>Calendario INTECA</span>
            </h3>
            <div className="space-y-3 font-sans text-xs">
              <div className="flex gap-3">
                <div className="bg-brand-blue/10 text-brand-blue font-bold px-3 py-1.5 rounded-xl text-center h-fit min-w-[50px]">
                  <p className="text-xs">28</p>
                  <p className="text-[9px] uppercase">Jun</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Examen Teórico Unificado IA</h4>
                  <p className="text-[10px] text-slate-500">10:00 AM • Plataforma Virtual</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-brand-green/10 text-brand-green font-bold px-3 py-1.5 rounded-xl text-center h-fit min-w-[50px]">
                  <p className="text-xs">02</p>
                  <p className="text-[9px] uppercase">Jul</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Taller de Cifrado Cuántico</h4>
                  <p className="text-[10px] text-slate-500">02:00 PM • Videollamada HD</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // Teacher Dashboard
  const renderTeacherDashboard = () => (
    <div id="teacher-dashboard" className="space-y-6">
      {/* Teacher Hero Banner */}
      <div className="bg-gradient-to-r from-brand-blue-light to-brand-blue rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-brand-blue-light/30">
        <div className="absolute right-0 top-0 opacity-10">
          <Award className="w-96 h-96" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="bg-white/10 border border-white/20 px-3 py-1 rounded-full text-white text-xs font-semibold w-fit">
              Panel del Docente Titular
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
              Bienvenido, Prof. {currentUser.name.split(" ")[0]}
            </h1>
            <p className="text-slate-200 max-w-xl text-sm leading-relaxed">
              La IA ha pre-corregido <strong className="text-brand-green">14 tareas</strong> abiertas hoy. Revisa el buzón para publicar calificaciones oficiales de INTECA.
            </p>
          </div>
          <div className="bg-brand-dark/40 border border-white/10 p-5 rounded-2xl text-center">
            <span className="text-xs text-slate-300 block uppercase font-mono tracking-wider">Estudiantes a Cargo</span>
            <span className="text-4xl font-display font-bold text-brand-green">142</span>
            <span className="text-[10px] text-slate-400 block mt-1">3 Cursos Activos</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Actions / Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Mis Cursos Asignados</h2>
            <button className="text-xs text-brand-green font-bold">Administrar Cursos</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded font-bold font-mono">{course.code}</span>
                    <h3 className="font-bold text-slate-900 mt-2">{course.title}</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{course.studentsCount} Alumnos</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span>Horario: {course.schedule}</span>
                  <span className="text-brand-green font-semibold">Activo</span>
                </div>
              </div>
            ))}
          </div>

          {/* AI Pre-grading Queue preview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-950 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-brand-green" />
                <span>Buzón de Corrección Asistida por IA</span>
              </h3>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">2 por aprobar</span>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Protocolo de Emergencia Rural</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Enviado por: Luis Ramírez Escalante • Coincidencia IA: 94%</p>
                </div>
                <button 
                  onClick={() => setActiveTab('courses')}
                  className="bg-brand-blue hover:bg-brand-blue-light text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Ver Corrección
                </button>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Análisis Forense Ransomware</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Enviado por: Clara Bermúdez • Coincidencia IA: 88%</p>
                </div>
                <button 
                  onClick={() => setActiveTab('courses')}
                  className="bg-brand-blue hover:bg-brand-blue-light text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Ver Corrección
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Schedule & Metrics */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-950 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-green" />
              <span>Rendimiento Promedio</span>
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Asistencia Global</span>
                  <span className="font-bold text-slate-900">92%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-blue h-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Promedio de Notas</span>
                  <span className="font-bold text-slate-900">84.5 / 100</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-green h-full" style={{ width: '84%' }}></div>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('analytics')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors text-center block"
              >
                Ver Informes Completos e IA Predictiva
              </button>
            </div>
          </div>

          {/* Institutional announcements */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-950 flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-green" />
              <span>Anuncios de Coordinación</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="border-l-2 border-brand-green pl-3 py-1">
                <p className="font-semibold text-slate-900">Auditoría LTI y SCORM</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Hace 1 día • Por Dirección Académica</p>
              </div>
              <div className="border-l-2 border-slate-300 pl-3 py-1">
                <p className="font-semibold text-slate-900">Mantenimiento de Servidores</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Hace 3 días • Soporte Técnico</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // Parent / Observer Dashboard
  const renderParentDashboard = () => (
    <div id="parent-dashboard" className="space-y-6">
      {/* Parent Welcome banner */}
      <div className="bg-slate-950 text-white rounded-3xl p-8 relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="bg-brand-green/20 border border-brand-green/40 px-3 py-1 rounded-full text-brand-green text-xs font-semibold w-fit">
              Perfil de Supervisión Familiar INTECA
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
              Seguimiento Académico: Luis Ramírez Escalante (Hijo)
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Aquí puedes supervisar las notas, asistencia y el progreso académico automatizado por IA de tu acudido.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-brand-green/20 rounded-xl text-brand-green">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Promedio del Estudiante</span>
              <span className="text-xl font-bold font-mono">88.5 / 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress & Grades */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Cursos de tu Hijo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map(course => (
              <div key={course.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold uppercase">{course.code}</span>
                    <h3 className="font-bold text-slate-950 mt-2">{course.title}</h3>
                  </div>
                  <span className="text-xs bg-brand-green/10 text-brand-green px-2 py-1 rounded font-bold">88 / 100</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progreso General</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-green h-full" style={{ width: `${course.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Behavioral report */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-brand-green" />
              <div>
                <h3 className="font-bold text-base">Informe Conductual por Inteligencia Artificial</h3>
                <p className="text-xs text-slate-400">Generado de forma automática basado en puntualidad y participación activa</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              &quot;El estudiante Luis Ramírez destaca por un excelente nivel de participación en los foros de telemedicina. Sus entregas técnicas muestran alta originalidad y precisión clínica. Se observa una asistencia perfecta (100%) a las salas virtuales sincronizadas. Recomendamos incentivar el estudio complementario en esquemas de cifrado de redes.&quot;
            </p>
          </div>
        </div>

        {/* Right panels */}
        <div className="space-y-6">
          {/* Quick Contact */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-950 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-blue" />
              <span>Contacto con Profesores</span>
            </h3>
            <p className="text-xs text-slate-500">¿Tienes dudas sobre el progreso? Envía un mensaje directo a los titulares:</p>
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Prof. Carlos Mendoza</p>
                  <p className="text-[10px] text-slate-500">Telemedicina y Paramédicos</p>
                </div>
                <button className="text-xs text-brand-green font-bold">Contactar</button>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Dra. Martha Reyes</p>
                  <p className="text-[10px] text-slate-500">Ciberseguridad y Redes</p>
                </div>
                <button className="text-xs text-brand-green font-bold">Contactar</button>
              </div>
            </div>
          </div>

          {/* Attendance Overview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-green" />
              <span>Asistencia del Alumno</span>
            </h3>
            <div className="text-center py-4 bg-slate-50 rounded-2xl">
              <span className="text-4xl font-display font-bold text-slate-900">98.4%</span>
              <span className="text-xs text-slate-500 block mt-1">Asistencia general verificada</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // Admin Dashboard
  const renderAdminDashboard = () => (
    <div id="admin-dashboard" className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Estudiantes Totales</span>
            <span className="text-2xl font-bold font-display text-slate-900">1,420</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-brand-green/10 text-brand-green rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Cursos Creados</span>
            <span className="text-2xl font-bold font-display text-slate-900">32</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl animate-pulse">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Salas Virtuales Activas</span>
            <span className="text-2xl font-bold font-display text-slate-900">8</span>
          </div>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-brand-green/20 text-brand-green rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Evaluaciones por IA hoy</span>
            <span className="text-2xl font-bold font-display text-brand-green">184</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main activity monitor */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-blue" />
            <span>Consola de Monitoreo en Tiempo Real (INTECA)</span>
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Servidor del Campus Virtual</span>
                <span className="text-brand-green font-semibold">● Óptimo</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-brand-green h-full" style={{ width: '98%' }}></div>
              </div>
              <p className="text-[10px] text-slate-400">Carga de CPU: 12% | Latencia de video: 14ms (Región Caribe)</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Integración de LLM (Gemini API)</span>
                <span className="text-brand-green font-semibold">● Conectado</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-brand-green h-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-[10px] text-slate-400">Velocidad promedio de token: 140 t/s | Cero colas de espera.</p>
            </div>
          </div>
        </div>

        {/* Quick config */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-950">Acciones Administrativas</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs font-semibold text-slate-800 transition-colors">
              ➕ Registrar nuevo Estudiante/Profesor
            </button>
            <button className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs font-semibold text-slate-800 transition-colors">
              ⚙️ Configuración Institucional del Caribe
            </button>
            <button className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs font-semibold text-slate-800 transition-colors">
              📥 Descargar Reportes de Auditoría LTI/SCORM
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div id="dashboard-view-root" className="space-y-6">
      <div id="dashboard-header-flex" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-brand-green uppercase tracking-widest">Portal Educativo</span>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Panel de Control Inteligente</h1>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm w-fit">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse"></div>
          <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Conectado a la Red INTECA</span>
        </div>
      </div>

      {currentUser.role === 'student' && renderStudentDashboard()}
      {currentUser.role === 'teacher' && renderTeacherDashboard()}
      {currentUser.role === 'parent' && renderParentDashboard()}
      {currentUser.role === 'admin' && renderAdminDashboard()}
    </div>
  );
}