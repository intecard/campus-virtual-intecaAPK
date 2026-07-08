import React, { useState } from "react";
import { 
  auth, 
  createUserProfile, 
  googleProvider, 
  logUserActivity 
} from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowLeft,
  Chrome
} from "lucide-react";
import { UserProfile, UserRole } from "../types";
// @ts-ignore
import logoInteca from "../icon.png";

interface AuthPageProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  // Register states
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [assignedRole, setAssignedRole] = useState<UserRole>('student');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Common UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError("Por favor, rellene todos los campos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const user = userCredential.user;
      
      const profile = await import("../firebase").then(f => f.getUserProfile(user.uid));
      if (profile) {
        await logUserActivity(profile.id, profile.name, profile.email, profile.role, "LOGIN", "Inicio de sesión exitoso");
        onAuthSuccess(profile);
      } else {
        throw new Error("Perfil de usuario no encontrado en la base de datos.");
      }
    } catch (err: any) {
      setError("Credenciales incorrectas o error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) { setError("Las contraseñas no coinciden."); return; }
    if (!acceptTerms) { setError("Debe aceptar los términos de uso."); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const profile = await createUserProfile(cred.user.uid, {
        name: `${regFirstName} ${regLastName}`,
        email: regEmail,
        phone: regPhone,
        role: assignedRole
      });
      await logUserActivity(profile.id, profile.name, profile.email, profile.role, "SIGNUP", "Registro de cuenta nueva");
      onAuthSuccess(profile);
    } catch (err) {
      setError("Error al registrar cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await createUserProfile(result.user.uid, {
        name: result.user.displayName || "Usuario Google",
        email: result.user.email || "",
        role: 'student'
      });
      onAuthSuccess(profile);
    } catch (err) {
      setError("Error en acceso con Google.");
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = async (role: UserRole) => {
    setLoading(true);
    try {
      const demoUid = `demo_${role}_${Date.now()}`;
      const name = role === 'observer' ? 'Oficial Auditor SISALRIL' : `Usuario ${role.toUpperCase()}`;
      const profile = await createUserProfile(demoUid, { name, role, email: `${role}@inteca.demo` });
      onAuthSuccess(profile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-page-root" className="min-h-screen bg-slate-900 flex flex-col md:flex-row text-slate-100">
      {/* Panel Izquierdo (Imagen/Logo) */}
      <div className="md:w-1/2 bg-slate-950 p-8 md:p-16 flex flex-col justify-between border-r border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-slate-900">IN</div>
          <div>
            <h1 className="font-bold text-xl">INTECA Live</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Campus Virtual</p>
          </div>
        </div>
        <div className="my-12">
          <h2 className="text-3xl font-bold mb-4">Gestión Académica en Salud</h2>
          <p className="text-slate-400 text-sm">Plataforma certificada para telemedicina y auditoría clínica.</p>
        </div>
      </div>

      {/* Panel Derecho (Login/Register) */}
      <div className="md:w-1/2 flex items-center justify-center p-6 bg-slate-900">
        <div className="max-w-md w-full space-y-6">
          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{error}</div>}
          
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Correo electrónico" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" />
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Contraseña" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" />
              <button type="submit" className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl text-xs">Entrar</button>
              <button type="button" onClick={handleGoogleSignIn} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs">Acceder con Google</button>
              <p className="text-xs text-slate-400 text-center">¿Nuevo? <button type="button" onClick={() => setView('register')} className="text-emerald-400 font-bold">Regístrate</button></p>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Nombre" onChange={(e) => setRegFirstName(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
                <input type="text" placeholder="Apellido" onChange={(e) => setRegLastName(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
              </div>
              <input type="email" placeholder="Correo" onChange={(e) => setRegEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
              <select value={assignedRole} onChange={(e) => setAssignedRole(e.target.value as UserRole)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                <option value="student">Estudiante</option>
                <option value="teacher">Profesor</option>
                <option value="observer">Auditor / Regulador</option>
                <option value="admin">Administrador</option>
              </select>
              <input type="password" placeholder="Contraseña" onChange={(e) => setRegPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
              <input type="password" placeholder="Confirmar" onChange={(e) => setRegConfirmPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
              <label className="flex items-center gap-2 text-[10px] text-slate-400"><input type="checkbox" onChange={(e) => setAcceptTerms(e.target.checked)} /> Acepto términos HIPAA</label>
              <button type="submit" className="w-full bg-emerald-500 font-bold py-3 rounded-xl text-xs">Registrar</button>
            </form>
          )}

          {/* Quick Login Buttons (Updated Roles) */}
          <div className="grid grid-cols-2 gap-2 mt-6">
            <button onClick={() => quickLoginAs('admin')} className="bg-slate-800 p-2 rounded text-[10px] text-rose-300">Admin</button>
            <button onClick={() => quickLoginAs('observer')} className="bg-slate-800 p-2 rounded text-[10px] text-sky-300">Auditor</button>
          </div>
        </div>
      </div>
    </div>
  );
}