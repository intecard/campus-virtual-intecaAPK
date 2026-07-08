import React, { useState } from "react";
import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { UserProfile, UserRole } from "../types";
import { Loader2, AlertCircle } from "lucide-react";

interface AuthPageProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // FLUJO DE LOGIN
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        
        if (userDoc.exists()) {
          onAuthSuccess(userDoc.data() as UserProfile);
        } else {
          setError("El usuario no tiene un perfil registrado en la base de datos.");
        }
      } else {
        // FLUJO DE REGISTRO
        if (!firstName || !lastName) {
          throw new Error("Por favor ingresa tu nombre y apellido.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // ¡AQUÍ ESTÁ LA CORRECCIÓN DEL ERROR DE FIRESTORE!
        // Aseguramos que ningún campo sea undefined asignando 0 por defecto.
        const newUser: UserProfile = {
          id: userCredential.user.uid,
          name: `${firstName} ${lastName}`.trim(),
          email: email,
          role: role,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}`,
          academicId: `INTECA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          joinedDate: new Date().toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }),
          progress: 0,          // Corrección del error rojo
          attendanceRate: 0,    // Corrección del error rojo
          averageGrade: 0,      // Corrección del error rojo
          suspended: false
        };

        await setDoc(doc(db, "users", userCredential.user.uid), newUser);
        onAuthSuccess(newUser);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError("Este correo ya está registrado.");
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') setError("Credenciales incorrectas.");
      else if (err.code === 'auth/weak-password') setError("La contraseña debe tener al menos 6 caracteres.");
      else setError(err.message || "Error al procesar la autenticación.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      
      if (userDoc.exists()) {
        onAuthSuccess(userDoc.data() as UserProfile);
      } else {
        // Si entra con Google por primera vez, creamos su perfil
        const newUser: UserProfile = {
          id: result.user.uid,
          name: result.user.displayName || "Usuario de Google",
          email: result.user.email || "",
          role: "student",
          avatar: result.user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${result.user.displayName}`,
          academicId: `INTECA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          joinedDate: new Date().toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }),
          progress: 0,
          attendanceRate: 0,
          averageGrade: 0,
          suspended: false
        };
        await setDoc(doc(db, "users", result.user.uid), newUser);
        onAuthSuccess(newUser);
      }
    } catch (err: any) {
      console.error(err);
      setError("Error al iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07131f] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-md space-y-8">
        
        {/* LOGO OFICIAL INTECA */}
        <div className="flex items-center gap-4">
          <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15,50 C15,22 35,10 50,10 C65,10 85,22 85,50" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
            <path d="M15,50 C15,25 32,15 50,15 C68,15 85,25 85,50" stroke="#059669" strokeWidth="5" strokeLinecap="round" />
            <rect x="10" y="44" width="10" height="20" rx="4" fill="#059669" />
            <rect x="80" y="44" width="10" height="20" rx="4" fill="#059669" />
            <path d="M32,38 L50,28 L68,38 C68,54 50,72 50,72 C50,72 32,54 32,38 Z" fill="#0f172a" stroke="#059669" strokeWidth="4" strokeLinejoin="round" />
            <path d="M45,40 H55 V60 H45 Z" fill="#10b981" />
            <path d="M38,47 H62 V53 H38 Z" fill="#10b981" />
            <path d="M15,62 Q25,78 43,76" stroke="#059669" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="43" cy="76" r="3" fill="#059669" />
          </svg>
          <div>
            <h1 className="text-2xl font-bold tracking-wider">INTECA Live</h1>
            <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Campus Virtual</p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-display font-bold">Gestión Académica en Salud</h2>
          <p className="text-slate-400 mt-2 text-sm">Plataforma certificada para telemedicina y auditoría clínica.</p>
        </div>

        {error && (
          <div className="bg-rose-950/50 border border-rose-900 p-4 rounded-xl flex gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-[#0d2136] border border-[#163554] rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
              <input
                type="text"
                placeholder="Apellido"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-[#0d2136] border border-[#163554] rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          )}

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0d2136] border border-[#163554] rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors"
            required
          />

          {!isLogin && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-[#0d2136] border border-[#163554] rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors text-white"
            >
              <option value="student">Estudiante</option>
              <option value="teacher">Profesor</option>
              <option value="observer">Auditor / SISALRIL</option>
              <option value="admin">Administrador TI</option>
            </select>
          )}

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0d2136] border border-[#163554] rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors"
            required
            minLength={6}
          />

          {!isLogin && (
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" required className="rounded bg-[#0d2136] border-[#163554] text-emerald-500" />
              <span>Acepto políticas de privacidad y normativas HIPAA</span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-[#07131f] font-bold text-base py-3.5 rounded-xl transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Entrar" : "Registrar Cuenta")}
          </button>
        </form>

        <div className="space-y-4 pt-4 border-t border-[#163554]">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Acceder con Google
          </button>

          <p className="text-center text-slate-400 text-sm">
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="text-emerald-500 font-bold hover:underline"
            >
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}