import { 
  TrendingUp, 
  Users, 
  Award, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  UserMinus,
  BookOpen,
  ChevronRight
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
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const performanceData = [
  { name: "Semana 1", Telemedicina: 72, Redes: 80, Ciberseguridad: 85 },
  { name: "Semana 2", Telemedicina: 78, Redes: 82, Ciberseguridad: 83 },
  { name: "Semana 3", Telemedicina: 85, Redes: 84, Ciberseguridad: 90 },
  { name: "Semana 4", Telemedicina: 80, Redes: 88, Ciberseguridad: 88 },
  { name: "Semana 5", Telemedicina: 92, Redes: 86, Ciberseguridad: 94 },
];

const categoryAttendance = [
  { name: "Soporte Clínico", Asistencia: 98 },
  { name: "Redes Clínicas", Asistencia: 94 },
  { name: "Seguridad de Datos", Asistencia: 91 },
  { name: "Foros Técnicos", Asistencia: 87 },
];

const COLORS = ["#10b981", "#0a3751", "#f59e0b", "#ef4444"];

export default function AnalyticsView() {
  // High-value Dropout prediction model data for Caribbean TECHNICAL institute
  const dropoutRiskList = [
    {
      student: "Carlos Ruiz Segura",
      risk: "Alto",
      score: 82, // 82% risk of leaving
      reason: "Bajo ingreso a plataforma, faltó a las últimas 3 aulas virtuales y no completó el laboratorio de cifrado IPsec.",
      action: "Programar cita con coordinador de redes; habilitar tutoría 24/7 con enfoque ultra simplificado en redes."
    },
    {
      student: "María Andrea Hernández",
      risk: "Medio",
      score: 48,
      reason: "Fluctuación en tiempos de entrega de tareas; reporta fallas de internet local por temporada de tormentas.",
      action: "Ofrecer descargas asincrónicas de videos; aplazar temporizador del examen unificado."
    },
    {
      student: "Luis Ramírez Escalante",
      risk: "Bajo",
      score: 8,
      reason: "Actividad sobresaliente en foros y uso continuo de INTECA Intellect.",
      action: "Postular al programa de insignias y tutoría para becas de telecomunicación."
    }
  ];

  return (
    <div id="analytics-view-root" className="space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-mono font-bold text-brand-green uppercase tracking-wider">Módulo de Analítica Avanzada</span>
        <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">Reportes y Predicciones de Desempeño</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-brand-green/10 text-brand-green rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Promedio General</span>
            <span className="text-2xl font-bold font-mono text-slate-900">86.2%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-brand-blue/10 text-brand-blue rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Tasa de Aprobación</span>
            <span className="text-2xl font-bold font-mono text-slate-900">94.8%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/10 text-amber-500 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Asistencia Promedio</span>
            <span className="text-2xl font-bold font-mono text-slate-900">92.4%</span>
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base">Evolución de Calificaciones por Materia</h3>
            <p className="text-xs text-slate-500">Métricas consolidadas promedio semanal del ciclo activo.</p>
          </div>
          
          <div className="w-full h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTele" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRedes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0a3751" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0a3751" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Telemedicina" stroke="#10b981" fillOpacity={1} fill="url(#colorTele)" strokeWidth={2} />
                <Area type="monotone" dataKey="Redes" stroke="#0a3751" fillOpacity={1} fill="url(#colorRedes)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Rates Bar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base">Tasa de Asistencia por Componente Curricular</h3>
            <p className="text-xs text-slate-500">Supervisión de presencialidad en salas de videoconferencia.</p>
          </div>

          <div className="w-full h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="Asistencia" fill="#0a3751" radius={[4, 4, 0, 0]} barSize={28}>
                  {categoryAttendance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI DROPOUT PREDICTOR PANEL (Explicitly Requested) */}
      <div id="ai-dropout-predictor" className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 space-y-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 opacity-5">
          <UserMinus className="w-80 h-80" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg md:text-xl">Predicción de Abandono Escolar mediante IA</h3>
              <p className="text-xs text-slate-400">El modelo predictivo de INTECA audita comportamientos de deserción temprana.</p>
            </div>
          </div>
          <span className="bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] px-3.5 py-1 rounded-full uppercase font-bold tracking-widest">
            Auditoría de Deserción: Activa
          </span>
        </div>

        {/* Dropout list layout */}
        <div className="space-y-4">
          {dropoutRiskList.map((st, sidx) => {
            const riskColor = st.risk === 'Alto' ? 'text-rose-400 bg-rose-500/15 border-rose-500/20' : st.risk === 'Medio' ? 'text-amber-400 bg-amber-500/15 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20';
            return (
              <div 
                key={sidx}
                className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/10 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-sm md:text-base text-white">{st.student}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${riskColor}`}>
                      Riesgo: {st.risk}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    <strong className="text-slate-400">Causa identificada:</strong> {st.reason}
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    <strong className="text-brand-green">Acción preventiva recomendada por IA:</strong> {st.action}
                  </p>
                </div>

                {/* Score Circle */}
                <div className="text-center shrink-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Índice Alerta</span>
                  <span className={`text-2xl font-mono font-bold ${st.risk === 'Alto' ? 'text-rose-500' : st.risk === 'Medio' ? 'text-amber-500' : 'text-brand-green'}`}>
                    {st.score}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-400">
          <span>Último escaneo predictivo: Hace 2 horas</span>
          <span className="text-brand-green font-bold">Modelo predictivo entrenado con 12k registros</span>
        </div>
      </div>
    </div>
  );
}
