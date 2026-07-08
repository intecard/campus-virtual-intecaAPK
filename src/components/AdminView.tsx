import React, { useState, useEffect } from "react";
import { 
  Users, 
  ShieldAlert, 
  Activity, 
  FileSpreadsheet, 
  FileDown, 
  Printer, 
  Settings, 
  UserX, 
  UserCheck, 
  RefreshCw, 
  Check, 
  Search, 
  BellRing,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Clock
} from "lucide-react";
import { db, logUserActivity, addNotificationToUser } from "../firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  setDoc,
  getDoc,
  serverTimestamp 
} from "firebase/firestore";
import { UserProfile, UserRole } from "../types";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";

interface AdminViewProps {
  currentUser: UserProfile;
}

export default function AdminView({ currentUser }: AdminViewProps) {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  
  // Search & Filters
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");

  // System Config State
  const [publicRegEnabled, setPublicRegEnabled] = useState(true);
  const [aiTutorEnabled, setAiTutorEnabled] = useState(true);
  const [strict2FA, setStrict2FA] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  
  // Global Broadcast Notification State
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Stats Counters
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    teachers: 0,
    observers: 0,
    admins: 0,
    suspended: 0
  });

  // Load database information on mount
  const fetchData = async () => {
    setLoadingUsers(true);
    setLoadingLogs(true);
    try {
      // 1. Fetch Users from Firestore
      const usersCol = collection(db, "users");
      const usersSnap = await getDocs(usersCol);
      const fetchedUsers: any[] = [];
      
      let students = 0, teachers = 0, observers = 0, admins = 0, suspended = 0;

      usersSnap.forEach((docSnap: any) => {
        const u = docSnap.data();
        const userData = {
          id: docSnap.id,
          name: u.name || "Usuario",
          email: u.email || "",
          role: u.role || "student",
          phone: u.phone || "No registrado",
          academicId: u.academicId || "INTECA-2026-REG",
          joinedDate: u.joinedDate || "Jul 2026",
          suspended: u.suspended || false,
          avatar: u.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.name || 'user')}`
        };
        fetchedUsers.push(userData);

        if (userData.suspended) suspended++;
        if (userData.role === 'student') students++;
        else if (userData.role === 'teacher') teachers++;
        else if (userData.role === 'observer') observers++;
        else if (userData.role === 'admin') admins++;
      });

      setUsersList(fetchedUsers);
      setStats({
        totalUsers: fetchedUsers.length,
        students,
        teachers,
        observers,
        admins,
        suspended
      });
      setLoadingUsers(false);

      // 2. Fetch Audit Logs from Firestore
      const logsCol = collection(db, "audit_logs");
      const logsQuery = query(logsCol, orderBy("timestamp", "desc"));
      const logsSnap = await getDocs(logsQuery);
      const fetchedLogs: any[] = [];
      
      const graphDataTemplate = [
        { name: 'Dom', Logins: 0, CambiosRol: 0, Bloqueos: 0, ConsultasAI: 0 },
        { name: 'Lun', Logins: 0, CambiosRol: 0, Bloqueos: 0, ConsultasAI: 0 },
        { name: 'Mar', Logins: 0, CambiosRol: 0, Bloqueos: 0, ConsultasAI: 0 },
        { name: 'Mie', Logins: 0, CambiosRol: 0, Bloqueos: 0, ConsultasAI: 0 },
        { name: 'Jue', Logins: 0, CambiosRol: 0, Bloqueos: 0, ConsultasAI: 0 },
        { name: 'Vie', Logins: 0, CambiosRol: 0, Bloqueos: 0, ConsultasAI: 0 },
        { name: 'Sab', Logins: 0, CambiosRol: 0, Bloqueos: 0, ConsultasAI: 0 },
      ];

      logsSnap.forEach((docSnap: any) => {
        const data = docSnap.data();
        let formattedTime = "Reciente";
        
        if (data.timestamp) {
          const dateObj = data.timestamp.toDate();
          formattedTime = dateObj.toLocaleString('es-CO');
          const dayIndex = dateObj.getDay();
          const action = data.action || "";
          
          if (action.includes("LOGIN")) graphDataTemplate[dayIndex].Logins += 1;
          else if (action.includes("ROLE")) graphDataTemplate[dayIndex].CambiosRol += 1;
          else if (action.includes("SUSPEND")) graphDataTemplate[dayIndex].Bloqueos += 1;
          else if (action.includes("AI_") || action.includes("TUTOR")) graphDataTemplate[dayIndex].ConsultasAI += 1;
        }

        fetchedLogs.push({
          id: docSnap.id,
          ...data,
          timeString: formattedTime
        });
      });

      const finalGraphData = [...graphDataTemplate.slice(1), graphDataTemplate[0]];

      setAuditLogs(fetchedLogs);
      setActivityData(finalGraphData);
      setLoadingLogs(false);

      const configDocRef = doc(db, "system_config", "global");
      const configSnap = await getDoc(configDocRef);
      if (configSnap.exists()) {
        const cfg = configSnap.data();
        setPublicRegEnabled(cfg.publicRegEnabled ?? true);
        setAiTutorEnabled(cfg.aiTutorEnabled ?? true);
        setStrict2FA(cfg.strict2FA ?? false);
      }
    } catch (err) {
      console.error("Error reading dashboard data from Firestore:", err);
      setLoadingUsers(false);
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole, targetName: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, { role: newRole });
      
      await logUserActivity(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        currentUser.role,
        "ROLE_CHANGE",
        `Se modificó el rol de "${targetName}" (ID: ${userId}) a "${newRole}"`
      );

      await addNotificationToUser(userId, `Tu rol académico de INTECA ha sido actualizado a: ${newRole.toUpperCase()}`);

      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      fetchData();
    } catch (err) {
      console.error("Error updating role:", err);
      alert("No se pudo actualizar el rol. Verifique los permisos.");
    }
  };

  const handleToggleSuspension = async (userId: string, currentSuspended: boolean, targetName: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const newSuspended = !currentSuspended;
      await updateDoc(userDocRef, { suspended: newSuspended });
      
      await logUserActivity(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        currentUser.role,
        newSuspended ? "USER_SUSPEND" : "USER_ACTIVATE",
        `Se ${newSuspended ? 'suspendió' : 'activó'} la cuenta de "${targetName}" (ID: ${userId})`
      );

      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, suspended: newSuspended } : u));
      fetchData();
    } catch (err) {
      console.error("Error toggling suspension:", err);
      alert("Error al modificar el estado de la cuenta.");
    }
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      const configDocRef = doc(db, "system_config", "global");
      await setDoc(configDocRef, {
        publicRegEnabled,
        aiTutorEnabled,
        strict2FA,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.name
      });

      await logUserActivity(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        currentUser.role,
        "CONFIG_UPDATE",
        `Configuración global actualizada: Registro=${publicRegEnabled}, TutorIA=${aiTutorEnabled}, 2FAExigido=${strict2FA}`
      );

      alert("Configuración del sistema guardada con éxito.");
      fetchData();
    } catch (err) {
      console.error("Error saving global config:", err);
      alert("Fallo al guardar la configuración.");
    } finally {
      setConfigSaving(false);
    }
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    
    setBroadcastSending(true);
    setBroadcastSuccess(false);
    try {
      await addNotificationToUser("all", `[ANUNCIO GENERAL]: ${broadcastText}`);
      
      await logUserActivity(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        currentUser.role,
        "BROADCAST",
        `Anuncio global emitido: "${broadcastText.substring(0, 60)}..."`
      );

      setBroadcastText("");
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 4000);
      fetchData();
    } catch (err) {
      console.error("Error broadcasting notification:", err);
      alert("Fallo al emitir la notificación general.");
    } finally {
      setBroadcastSending(false);
    }
  };

  const exportUsersToCSV = () => {
    const headers = ["ID", "Nombre", "Email", "Telefono", "Rol", "Joined Date", "Suspended"];
    const rows = usersList.map(u => [
      u.id,
      u.name,
      u.email,
      u.phone,
      u.role,
      u.joinedDate,
      u.suspended ? "SI" : "NO"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Usuarios_INTECA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportLogsToCSV = () => {
    const headers = ["ID Log", "User ID", "Usuario", "Email", "Rol", "Accion", "Detalles", "Fecha"];
    const rows = auditLogs.map(l => [
      l.id || "",
      l.userId || "",
      l.userName || "",
      l.userEmail || "",
      l.userRole || "",
      l.action || "",
      l.details || "",
      l.timeString || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Auditoria_Actividades_INTECA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintSystemReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor, habilite las ventanas emergentes para generar el reporte PDF.");
      return;
    }

    const htmlContent = `
      <html>
      <head>
        <title>INTECA - Reporte Oficial de Auditoría y Usuarios</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; }
          h1 { font-size: 24px; color: #0f172a; margin-bottom: 5px; }
          .subtitle { font-size: 11px; text-transform: uppercase; color: #10b981; font-weight: bold; letter-spacing: 1px; margin-bottom: 25px; }
          .meta-info { display: flex; justify-content: space-between; font-size: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 30px; color: #64748b; }
          .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
          .card-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; }
          .card-value { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11px; }
          th { background-color: #f1f5f9; text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e1; font-weight: bold; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
          .badge-admin { background-color: #fee2e2; color: #991b1b; }
          .badge-teacher { background-color: #fef3c7; color: #92400e; }
          .badge-student { background-color: #d1fae5; color: #065f46; }
          .badge-observer { background-color: #e0f2fe; color: #0369a1; }
          .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <h1>AULA VIRTUAL INTECA - INFORME GENERAL DE CONTROL</h1>
        <div class="subtitle">Instituto Técnico del Caribe • Campus Virtual Seguro</div>
        
        <div class="meta-info">
          <div>Generado por: <strong>${currentUser.name} (${currentUser.role.toUpperCase()})</strong></div>
          <div>Fecha del Reporte: <strong>${new Date().toLocaleString('es-CO')}</strong></div>
          <div>Cumplimiento: <strong>Estándar HIPAA Ciberseguridad</strong></div>
        </div>

        <div class="summary-cards">
          <div class="card">
            <div class="card-title">Usuarios Totales</div>
            <div class="card-value">${stats.totalUsers}</div>
          </div>
          <div class="card">
            <div class="card-title">Estudiantes</div>
            <div class="card-value">${stats.students}</div>
          </div>
          <div class="card">
            <div class="card-title">Docentes</div>
            <div class="card-value">${stats.teachers}</div>
          </div>
          <div class="card">
            <div class="card-title">Auditores</div>
            <div class="card-value">${stats.observers}</div>
          </div>
        </div>

        <h2>Directorio de Cuentas Escolares</h2>
        <table>
          <thead>
            <tr>
              <th>ID Matrícula</th>
              <th>Nombre Completo</th>
              <th>Email</th>
              <th>Rol Académico</th>
              <th>Registro</th>
              <th>Suspensión</th>
            </tr>
          </thead>
          <tbody>
            ${usersList.map(u => `
              <tr>
                <td><strong>${u.academicId}</strong></td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span class="badge badge-${u.role}">${u.role}</span></td>
                <td>${u.joinedDate}</td>
                <td><strong>${u.suspended ? "SUSPENDIDO" : "ACTIVO"}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Historial Reciente de Auditoría y Logs</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha / Hora</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Operación</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
            ${auditLogs.slice(0, 15).map(l => `
              <tr>
                <td>${l.timeString || 'Reciente'}</td>
                <td>${l.userName} (${l.userEmail})</td>
                <td>${l.userRole}</td>
                <td><strong>${l.action}</strong></td>
                <td>${l.details}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Documento oficial de carácter privado. Emitido bajo cifrado TLS de INTECA.
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const filteredUsers = usersList.filter((u: any) => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.academicId.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredLogs = auditLogs.filter((l: any) => {
    return (l.userName || "").toLowerCase().includes(logSearch.toLowerCase()) ||
           (l.userEmail || "").toLowerCase().includes(logSearch.toLowerCase()) ||
           (l.action || "").toLowerCase().includes(logSearch.toLowerCase()) ||
           (l.details || "").toLowerCase().includes(logSearch.toLowerCase());
  });

  return (
    <div id="admin-view-root" className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-sky-500 uppercase tracking-wider">Módulo de Control Jerárquico</span>
          <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">Consola de Auditoría y Roles</h1>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sincronizar Firestore</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Usuarios Totales</span>
          <strong className="text-2xl text-slate-900 block mt-1">{stats.totalUsers}</strong>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm text-center">
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Estudiantes</span>
          <strong className="text-2xl text-emerald-700 block mt-1">{stats.students}</strong>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm text-center">
          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Profesores</span>
          <strong className="text-2xl text-amber-700 block mt-1">{stats.teachers}</strong>
        </div>
        <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 shadow-sm text-center">
          <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider block">Auditores / CM</span>
          <strong className="text-2xl text-sky-700 block mt-1">{stats.observers}</strong>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm text-center">
          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Administradores</span>
          <strong className="text-2xl text-rose-700 block mt-1">{stats.admins}</strong>
        </div>
        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Suspendidos</span>
          <strong className="text-2xl text-slate-700 block mt-1">{stats.suspended}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-950 font-display flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            <span>Configuración y Políticas del Sistema</span>
          </h3>
          <p className="text-xs text-slate-500">
            Regule las variables críticas de accesibilidad, automatización por IA y robustez criptográfica de INTECA.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-900">Permitir Registro de Alumnos</p>
                <p className="text-[10px] text-slate-500">Habilita que nuevos estudiantes creen cuentas por sí mismos.</p>
              </div>
              <input
                type="checkbox"
                checked={publicRegEnabled}
                onChange={(e) => setPublicRegEnabled(e.target.checked)}
                className="rounded text-sky-500 focus:ring-0 cursor-pointer w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-900 font-display flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Tutor Inteligente IA Activo</span>
                </p>
                <p className="text-[10px] text-slate-500">Permite consultas al motor Gemini 3.5 desde el aula.</p>
              </div>
              <input
                type="checkbox"
                checked={aiTutorEnabled}
                onChange={(e) => setAiTutorEnabled(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-0 cursor-pointer w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-900 font-display flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                  <span>Exigir Doble Factor (2FA) Estricto</span>
                </p>
                <p className="text-[10px] text-slate-500">Fuerza a todos los docentes y administradores a usar MFA.</p>
              </div>
              <input
                type="checkbox"
                checked={strict2FA}
                onChange={(e) => setStrict2FA(e.target.checked)}
                className="rounded text-rose-500 focus:ring-0 cursor-pointer w-4 h-4"
              />
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={configSaving}
              className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl transition-all text-center flex items-center justify-center gap-2"
            >
              {configSaving ? "Guardando cambios..." : "Guardar Ajustes en Firestore"}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-950 font-display flex items-center gap-2">
              <BellRing className="w-5 h-5 text-sky-500 animate-pulse" />
              <span>Emisión de Anuncio General Inmediato</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Redacte una alerta que aparecerá en tiempo real en los centros de notificaciones de todos los usuarios vinculados al campus virtual.
            </p>
          </div>

          <form onSubmit={handleBroadcastAnnouncement} className="space-y-3.5">
            <textarea
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="Atención comunidad de INTECA: Se realizará mantenimiento programado del servidor de comunicaciones..."
              className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-sky-500 focus:bg-white focus:outline-none font-medium leading-relaxed"
              required
            ></textarea>

            <div className="flex items-center justify-between gap-4">
              {broadcastSuccess ? (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> ¡Anuncio global emitido!
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Inyección síncrona en Firestore</span>
              )}

              <button
                type="submit"
                disabled={broadcastSending}
                className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-2 px-5 rounded-xl transition-all shadow-md shadow-sky-500/10 disabled:opacity-50"
              >
                {broadcastSending ? "Transmitiendo..." : "Emitir Comunicado"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-950 font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-500" />
              <span>Control de Cuentas y Privilegios Escolares</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervise el estado de conexión, cambie los roles de acceso o suspenda cuentas de forma inmediata.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            <button
              onClick={exportUsersToCSV}
              className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={handlePrintSystemReport}
              className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Generar PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o matrícula..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-semibold text-slate-700"
            >
              <option value="all">Todos los Roles Académicos</option>
              <option value="student">Estudiantes</option>
              <option value="teacher">Profesores / Titulares</option>
              <option value="observer">Auditores / SISALRIL</option>
              <option value="admin">Administradores TI</option>
            </select>
          </div>
          <div className="text-right text-xs text-slate-400 self-center">
            Filtrados: <strong>{filteredUsers.length}</strong> de {usersList.length} cuentas
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
          {loadingUsers ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-500" />
              <p>Consultando cuentas escolares en Firestore...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No se encontraron usuarios que coincidan con la búsqueda.
            </div>
          ) : (
            <>
              <div className="block md:hidden divide-y divide-slate-100">
                {filteredUsers.map((u: any) => (
                  <div key={u.id} className={`p-4 space-y-3 ${u.suspended ? 'bg-rose-50/20' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-snug">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{u.email}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {u.academicId}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100/50 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Teléfono</span>
                        <span className="text-slate-700 font-medium">{u.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Registro</span>
                        <span className="text-slate-700 font-medium">{u.joinedDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <div className="flex-1">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold mb-1">Rol Institucional</span>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole, u.name)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        >
                          <option value="student">Estudiante</option>
                          <option value="teacher">Profesor</option>
                          <option value="observer">Auditor / Regulador</option>
                          <option value="admin">Administrador TI</option>
                        </select>
                      </div>
                      <div className="self-end">
                        <button
                          onClick={() => handleToggleSuspension(u.id, u.suspended, u.name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            u.suspended 
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          }`}
                        >
                          {u.suspended ? (
                            <><UserCheck className="w-3.5 h-3.5" /> <span>Activar</span></>
                          ) : (
                            <><UserX className="w-3.5 h-3.5" /> <span>Suspender</span></>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <table className="w-full text-left text-xs text-slate-700 hidden md:table">
                <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-100">
                  <tr>
                    <th className="p-4">Identificación</th>
                    <th className="p-4">Nombre y Email</th>
                    <th className="p-4">Teléfono</th>
                    <th className="p-4">Rol Institucional</th>
                    <th className="p-4">Fecha Ingreso</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u: any) => (
                    <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${u.suspended ? 'bg-rose-50/20' : ''}`}>
                      <td className="p-4 font-mono font-bold text-slate-900">{u.academicId}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900 leading-none">{u.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 font-medium">{u.phone}</td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole, u.name)}
                          className="bg-white border border-slate-200 rounded-lg p-1 text-[11px] font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500"
                        >
                          <option value="student">Estudiante</option>
                          <option value="teacher">Profesor</option>
                          <option value="observer">Auditor / Regulador</option>
                          <option value="admin">Administrador TI</option>
                        </select>
                      </td>
                      <td className="p-4 text-slate-400 font-medium">{u.joinedDate}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleToggleSuspension(u.id, u.suspended, u.name)}
                            title={u.suspended ? "Activar cuenta" : "Suspender cuenta"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.suspended 
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            }`}
                          >
                            {u.suspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-bold text-slate-950 font-display flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-500" />
              <span>Densidad de Actividad y Consultas en INTECA</span>
            </h3>
            <p className="text-xs text-slate-500">
              Monitoreo analítico real, extraído directamente de los registros de Firebase de la última semana.
            </p>
          </div>
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #f1f5f9' }} />
                <Area type="monotone" dataKey="ConsultasAI" name="Consultas Tutor IA" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorAI)" strokeWidth={2} />
                <Area type="monotone" dataKey="Logins" name="Accesos" stroke="#0f172a" fillOpacity={1} fill="url(#colorLogs)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-950 font-display flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-500" />
              <span>Cumplimiento Normativo</span>
            </h3>
            <p className="text-xs text-slate-500">
              Evaluación automática de conformidad reglamentaria según los lineamientos del Ministerio de Salud.
            </p>
          </div>
          <div className="space-y-3.5">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span>Cifrado de Telemedicina (HIPAA)</span>
                <span className="text-emerald-600 font-bold">100% OK</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-full"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span>Rendimiento Académico Promedio</span>
                <span className="text-emerald-600 font-bold">88.5%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[88.5%]"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span>Alineación Curricular de Cursos</span>
                <span className="text-sky-500 font-bold">95.0%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full w-[95%]"></div>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl flex gap-2.5 text-[11px] text-amber-800 leading-normal">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <p>
              <strong>Atención:</strong> Las evaluaciones emitidas por la IA y firmadas digitalmente requieren respaldo del docente antes del cierre.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-950 font-display flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-900" />
              <span>Registro de Auditoría de Seguridad (Live Trail)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Trazabilidad en tiempo real de todas las transacciones de acceso, cambios de rol y administración.
            </p>
          </div>
          <div className="flex gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full md:w-60 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <button
              onClick={exportLogsToCSV}
              className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition-colors shrink-0"
            >
              <FileDown className="w-4 h-4 text-emerald-600" />
              <span>Exportar Logs</span>
            </button>
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
          {loadingLogs ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Consultando registro de auditoría en Firestore...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No hay logs de auditoría disponibles o que coincidan con el filtro.
            </div>
          ) : (
            <>
              <div className="block md:hidden divide-y divide-slate-100">
                {filteredLogs.slice(0, 30).map((l: any) => {
                  let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                  if (l.action.includes("LOGIN")) badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  else if (l.action.includes("ROLE") || l.action.includes("CONFIG")) badgeColor = "bg-sky-50 text-sky-700 border-sky-100";
                  else if (l.action.includes("SUSPEND")) badgeColor = "bg-rose-50 text-rose-700 border-rose-100";
                  else if (l.action.includes("BROADCAST")) badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                  return (
                    <div key={l.id} className="p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
                          <Clock className="w-3.5 h-3.5" />
                          {l.timeString || "Reciente"}
                        </span>
                        <span className={`px-2 py-0.5 border rounded-md text-[9px] font-bold font-mono ${badgeColor}`}>
                          {l.action}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{l.userName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{l.userEmail} • <span className="capitalize">{l.userRole}</span></p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-slate-600 leading-normal mt-1 font-sans">
                        {l.details}
                      </div>
                    </div>
                  );
                })}
              </div>
              <table className="w-full text-left text-xs text-slate-700 hidden md:table">
                <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">Marca Temporal</th>
                    <th className="p-3.5">Usuario / Email</th>
                    <th className="p-3.5">Rol</th>
                    <th className="p-3.5">Operación</th>
                    <th className="p-3.5">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {filteredLogs.slice(0, 50).map((l: any) => {
                    let badgeColor = "bg-slate-100 text-slate-700";
                    if (l.action.includes("LOGIN")) badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                    else if (l.action.includes("ROLE") || l.action.includes("CONFIG")) badgeColor = "bg-sky-50 text-sky-700 border-sky-100";
                    else if (l.action.includes("SUSPEND")) badgeColor = "bg-rose-50 text-rose-700 border-rose-100";
                    else if (l.action.includes("BROADCAST")) badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                    return (
                      <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 text-slate-500 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {l.timeString || "Reciente"}
                          </span>
                        </td>
                        <td className="p-3.5 font-sans">
                          <div>
                            <p className="font-bold text-slate-900">{l.userName}</p>
                            <p className="text-[10px] text-slate-400">{l.userEmail}</p>
                          </div>
                        </td>
                        <td className="p-3.5 font-sans capitalize font-semibold text-slate-600">
                          {l.userRole}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold ${badgeColor}`}>
                            {l.action}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 leading-relaxed font-sans max-w-sm truncate" title={l.details}>
                          {l.details}
                        </td>
                      </tr>                            
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}