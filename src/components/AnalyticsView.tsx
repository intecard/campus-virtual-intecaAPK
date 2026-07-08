import React from "react";
import { 
  TrendingUp, 
  Users, 
  Award, 
  Calendar, 
  AlertTriangle, 
  Sparkles, 
  UserMinus,
  Activity
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
  // Modelo de predicción ajustado a perfiles de riesgo académico real
  const dropoutRiskList = [
    {
      student: "Carlos Ruiz Segura",
      risk: "Alto",
      score: 82,
      reason: "Baja frecuencia de conexión; inactividad en laboratorios de cifrado.",
      action: "Notificar al coordinador y activar plan de rescate académico."
    },
    {
      student: "María Andrea Hernández",
      risk: "Medio",
      score: 48,
      reason: "Fluctuación en tiempos de entrega; posibles fallas de infraestructura local.",
      action: "Habilitar repositorio asincrónico para descargas de material."
    },
    {
      student: "Luis Ramírez Escalante",
      risk: "Bajo",
      score: 8,
      reason: "Desempeño sobresaliente y uso activo de herramientas institucionales.",
      action: "Incluir en programa de becas de excelencia y monitoría."
    }
  ];

  return (
    <div id="analytics-view-root" className="space-y-6 animate-in fade-in duration-500">
      <div>
        <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider">Módulo de Analítica Avanzada</span>
        <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">Reportes y Predicciones Institucionales</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Promedio General</span>
            <span className="text-2xl font-bold font-mono text-slate-900">86.2%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-sky-50 text-sky-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Tasa de Aprobación</span>
            <span className="text-2xl font-bold font-mono text-slate-900">94.8%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Asistencia Promedio</span>
            <span className="text-2xl font-bold font-mono text-slate-900">92.4%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base">Evolución de Calificaciones</h3>
            <p className="text-xs text-slate-500">Métricas consolidadas promedio semanal del ciclo activo.</p>
          </div>
          <div className="w-full h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTele" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Telemedicina" stroke="#10b981" fillOpacity={1} fill="url(#colorTele)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base">Tasa de Asistencia por Componente</h3>
            <p className="text-xs text-slate-500">Supervisión de presencialidad en salas de videoconferencia.</p>
          </div>
          <div className="w-full h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="Asistencia" radius={[4, 4, 0, 0]} barSize={28}>
                  {categoryAttendance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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
              <h3 className="font-display font-bold text-lg md:text-xl">Predicción de Abandono por IA</h3>
              <p className="text-xs text-slate-400">Modelo predictivo entrenado para auditoría temprana.</p>
            </div>
          </div>
          <span className="bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] px-3.5 py-1 rounded-full uppercase font-bold tracking-widest">
            Auditoría Activa
          </span>
        </div>

        <div className="space-y-4">
          {dropoutRiskList.map((st, sidx) => (
            <div key={sidx} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/10 transition-colors">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-sm text-white">{st.student}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${st.risk === 'Alto' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    Riesgo: {st.risk}
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed"><strong className="text-slate-400">Causa:</strong> {st.reason}</p>
                <p className="text-slate-300 text-xs leading-relaxed"><strong className="text-emerald-400">Acción IA:</strong> {st.action}</p>
              </div>
              <div className="text-center shrink-0">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Índice Alerta</span>
                <span className="text-2xl font-mono font-bold text-white">{st.score}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-400">
          <span>Último escaneo predictivo: Hace 2 horas</span>
        </div>
      </div>
    </div>
  );
}