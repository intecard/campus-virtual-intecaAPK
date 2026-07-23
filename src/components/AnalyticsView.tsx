import React, { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Users, 
  Award, 
  AlertTriangle, 
  Activity,
  Loader2,
  BookOpen,
  ArrowUpRight,
  Clock,
  Target,
  AlertCircle
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Course, UserProfile } from "../types";

const COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6"];

interface AnalyticsViewProps {
  currentUser: UserProfile;
}

export default function AnalyticsView({ currentUser }: AnalyticsViewProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Identificador de roles
  const isAdmin = currentUser?.role === 'admin';

  // ==========================================
  // CARGA DE DATOS REALES (FIREBASE)
  // ==========================================
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const coursesSnap = await getDocs(collection(db, "courses"));
        const loadedCourses = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        
        const usersSnap = await getDocs(collection(db, "users"));
        const loadedStudents = usersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
          .filter(user => user.role === 'student');

        setCourses(loadedCourses);
        setStudents(loadedStudents);
      } catch (error) {
        console.error("Error cargando analíticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  // ==========================================
  // CÁLCULOS Y MÉTRICAS DINÁMICAS (100% REALES)
  // ==========================================
  const totalProgress = courses.reduce((acc, curr) => acc + (curr.progress || 0), 0);
  const averageProgress = courses.length > 0 ? (totalProgress / courses.length).toFixed(1) : "0.0";
  const totalStudents = students.length;
  const passedCourses = courses.filter(c => (c.progress || 0) >= 60).length;
  const approvalRate = courses.length > 0 ? ((passedCourses / courses.length) * 100).toFixed(1) : "0.0";

  // Datos para Gráficos
  const chartDataCourses = courses.length > 0 
    ? courses.map(c => ({
        name: c.code || c.title.substring(0, 10),
        Progreso: c.progress || 0,
        completo: c.title
      }))
    : [{ name: "Sin datos", Progreso: 0, completo: "Aún no hay cursos" }];

  const categoriesMap: Record<string, number> = {};
  courses.forEach(c => {
    const cat = c.category || "General";
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
  });
  
  const chartDataCategories = Object.keys(categoriesMap).length > 0
    ? Object.keys(categoriesMap).map(cat => ({
        name: cat,
        Cantidad: categoriesMap[cat]
      }))
    : [{ name: "Sin datos", Cantidad: 0 }];

  // ==========================================
  // CLASIFICACIÓN DE ALUMNOS (ARRANCAN EN 0)
  // ==========================================
  const topStudents = students.map(st => ({
    name: st.name,
    email: st.email,
    avatar: st.avatar,
    grade: st.progress || 0 // 100% Real, sin generadores aleatorios
  })).sort((a, b) => b.grade - a.grade).slice(0, 4);

  const dropoutRiskList = students.map(st => {
    const score = st.riskScore || 0; // 100% Real
    let riskLevel = score === 0 ? "Al día" : (score > 30 ? "Alto" : "Medio");
    let issue = score === 0 ? "Asistencia y entregas al día" : "Bajo rendimiento / Ausentismo";

    return {
      name: st.name,
      avatar: st.avatar,
      risk: riskLevel,
      issue: issue,
      score: score,
    };
  }).sort((a, b) => b.score - a.score).slice(0, 3);

  // ==========================================
  // RENDERIZADO CONDICIONAL Y SEGURIDAD
  // ==========================================

  // Escudo de Protección: Bloquear estudiantes y auditores
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'teacher') {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm m-6 animate-in zoom-in-95">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Acceso Restringido</h2>
        <p className="text-slate-500 mt-2">No tienes los permisos necesarios para acceder a este módulo.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-wider font-bold">Procesando Big Data INTECA...</p>
      </div>
    );
  }

  return (
    <div id="analytics-view-root" className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            {isAdmin ? "Consola Analítica Global" : "Progreso de Estudiantes"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin 
              ? "Métricas de rendimiento e inteligencia institucional de toda la plataforma." 
              : "Monitoreo del desempeño individual y sistema de alerta de tus alumnos."}
          </p>
        </div>
      </div>

      {/* KPIS DE ALTO NIVEL (SOLO ADMINISTRADOR) */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-500/30 transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-500">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full text-emerald-700 bg-emerald-50">
                <ArrowUpRight className="w-3 h-3" /> Activos
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-display font-bold text-slate-900 mb-1">{totalStudents}</h3>
              <p className="text-sm font-medium text-slate-500">Estudiantes Totales</p>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
              <Users className="w-32 h-32" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-500/30 transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-display font-bold text-slate-900 mb-1">{averageProgress}%</h3>
              <p className="text-sm font-medium text-slate-500">Progreso Promedio</p>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-32 h-32" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-amber-500/30 transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-display font-bold text-slate-900 mb-1">{approvalRate}%</h3>
              <p className="text-sm font-medium text-slate-500">Tasa de Aprobación</p>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
              <Award className="w-32 h-32" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-purple-500/30 transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-500/10 text-purple-500">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-display font-bold text-slate-900 mb-1">{courses.length}</h3>
              <p className="text-sm font-medium text-slate-500">Cursos Activos</p>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
              <BookOpen className="w-32 h-32" />
            </div>
          </div>
        </div>
      )}

      {/* ÁREA CENTRAL: GRÁFICOS Y LISTAS (ADAPTATIVO) */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'gap-6'} gap-6`}>
        
        {/* Gráficos de Recharts (SOLO ADMINISTRADOR) */}
        {isAdmin && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" /> Rendimiento Global por Asignatura
              </h2>
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataCourses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProgreso" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="Progreso" stroke="#10b981" fillOpacity={1} fill="url(#colorProgreso)" strokeWidth={3} activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-500" /> Distribución Académica
              </h2>
              <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataCategories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="Cantidad" radius={[6, 6, 0, 0]} barSize={40}>
                      {chartDataCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Paneles de Estudiantes (VISTOS POR ADMIN Y PROFESOR) */}
        <div className={`space-y-6 flex flex-col ${!isAdmin ? 'grid md:grid-cols-2 md:space-y-0 gap-6' : ''}`}>
          
          {/* Cuadro de Honor */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex-1">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Cuadro de Honor
            </h2>
            <div className="space-y-4">
              {topStudents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No hay estudiantes registrados.</p>
              ) : (
                topStudents.map((student, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <img src={student.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=inteca"} className="w-8 h-8 rounded-full bg-white object-cover border border-slate-200" alt="Avatar" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-tight">{student.name}</h4>
                        <p className="text-[10px] text-slate-500 truncate w-32">{student.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-600">{student.grade}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sistema de Alerta Temprana */}
          <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm flex-1">
            <h2 className="text-lg font-bold text-rose-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" /> Alertas de Riesgo
            </h2>
            <div className="space-y-3">
              {dropoutRiskList.length === 0 ? (
                <p className="text-xs text-rose-400 text-center py-4">No se detectan alumnos en riesgo.</p>
              ) : (
                dropoutRiskList.map((alert, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-2xl border border-rose-100 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <img src={alert.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=inteca"} className="w-5 h-5 rounded-full" alt="Avatar" />
                        {alert.name}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                        alert.risk === 'Alto' ? 'bg-rose-100 text-rose-700' : 
                        alert.risk === 'Medio' ? 'bg-amber-100 text-amber-700' : 
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {alert.risk}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Estado: {alert.issue}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}