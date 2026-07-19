import React, { useState } from "react";
import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithCredential,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { UserProfile, UserRole } from "../types";
import { Loader2, AlertCircle, KeyRound } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

interface AuthPageProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [mfaResolver, setMfaResolver] = useState<any>(null);

  const generateSafeProfile = (uid: string, name: string, email: string, role: UserRole): UserProfile => {
    return {
      id: uid,
      name: name || "Usuario Nuevo",
      email: email || "",
      role: role,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name.replace(/ /g, '')}`,
      academicId: `INTECA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      joinedDate: new Date().toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }),
      progress: 0,
      attendanceRate: 100,
      averageGrade: 0,
      suspended: false
    };
  };

  const handleMfaRequired = async (mfaError: any) => {
    try {
      const resolver = getMultiFactorResolver(auth, mfaError);
      setMfaResolver(resolver);
      setIsMfaRequired(true);

      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });

      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[0],
        session: resolver.session
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const vId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);
      setVerificationId(vId);
    } catch (err: any) {
      console.error("Error al iniciar el envío de SMS:", err);
      setError("No se pudo despachar el código SMS de verificación. Comprueba el formato de tu número.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        
        if (userDoc.exists()) {
          onAuthSuccess(userDoc.data() as UserProfile);
        } else {
          setError("El usuario no tiene un perfil registrado en la base de datos.");
        }
      } else {
        if (!firstName || !lastName) throw new Error("Por favor ingresa tu nombre y apellido.");

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // REGLA DE SEGURIDAD ABSOLUTA: 
        // Todos nacen como 'student', excepto el master admin (Luis).
        const isMasterAdmin = email.toLowerCase() === "luisramirezescalante1985@gmail.com";
        const assignedRole: UserRole = isMasterAdmin ? "admin" : "student";

        const newUser = generateSafeProfile(
          userCredential.user.uid, 
          `${firstName} ${lastName}`.trim(), 
          email, 
          assignedRole
        );

        await setDoc(doc(db, "users", userCredential.user.uid), newUser);
        onAuthSuccess(newUser);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/multi-factor-auth-required') {
        handleMfaRequired(err);
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Este correo ya está registrado. Haz clic en 'Inicia sesión'.");
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError("Correo o contraseña incorrectos.");
      } else if (err.code === 'auth/weak-password') {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError(err.message || "Error al procesar la autenticación.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      const userCredential = await mfaResolver.resolveSignIn(multiFactorAssertion);
      
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        onAuthSuccess(userDoc.data() as UserProfile);
      } else {
        setError("Perfil de usuario no encontrado tras completar la verificación.");
      }
    } catch (err: any) {
      console.error(err);
      setError("El código de verificación SMS es incorrecto o ha expirado.");
    } finally {
      setLoading(false);
    }
  };

  // INTERCEPTOR DE GOOGLE BLINDADO CONTRA RECARGAS DE PÁGINA Y CON ASIGNACIÓN DE ROL SEGURA
  const handleGoogleSignIn = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let result;

      if (Capacitor.isNativePlatform()) {
        // 1. MODO APK
        GoogleAuth.initialize({
          clientId: '266892587219-mm3og84lqca9kakskks3jehlm7e01a3t.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });

        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        result = await signInWithCredential(auth, credential);

      } else {
        // 2. MODO WEB
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        result = await signInWithPopup(auth, provider);
      }

      if (result && result.user) {
        const userDoc = await getDoc(doc(db, "users", result.user.uid));
        if (userDoc.exists()) {
          onAuthSuccess(userDoc.data() as UserProfile);
        } else {
          // REGLA DE SEGURIDAD ABSOLUTA EN GOOGLE: 
          // Validar si es el master admin en el primer login de Google
          const isMasterAdmin = result.user.email?.toLowerCase() === "luisramirezescalante1985@gmail.com";
          const assignedRole: UserRole = isMasterAdmin ? "admin" : "student";

          const newUser = generateSafeProfile(
            result.user.uid,
            result.user.displayName || "Usuario de Google",
            result.user.email || "",
            assignedRole
          );
          if (result.user.photoURL) newUser.avatar = result.user.photoURL;
          await setDoc(doc(db, "users", result.user.uid), newUser);
          onAuthSuccess(newUser);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/multi-factor-auth-required') {
        handleMfaRequired(err);
      } else if (err.code === 'auth/popup-closed-by-user' || err.type === 'user_cancelled') {
        setLoading(false); 
      } else {
        setError(`Error Google: ${err.message || "Fallo en la autenticación"}`);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#07131f] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div id="recaptcha-container"></div>

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
            <p className="break-words w-full">{error}</p>
          </div>
        )}

        {isMfaRequired ? (
          <form onSubmit={handleMfaSubmit} className="space-y-6 bg-[#0d2136] border border-[#163554] p-6 rounded-2xl">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-full">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Verificación de Identidad</h3>
              <p className="text-sm text-slate-400">Introduce el código de seguridad que hemos enviado por mensaje de texto a tu teléfono móvil.</p>
            </div>

            <input 
              type="text" 
              placeholder="Código de 6 dígitos" 
              value={verificationCode} 
              onChange={(e) => setVerificationCode(e.target.value)} 
              className="w-full bg-[#07131f] border border-[#163554] rounded-xl px-4 py-3.5 text-center text-xl font-mono tracking-widest focus:outline-none focus:border-emerald-500 transition-colors text-white" 
              required 
              maxLength={6}
            />

            <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-[#07131f] font-bold text-base py-3.5 rounded-xl transition-all flex justify-center items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verificar código"}
            </button>

            <button 
              type="button" 
              onClick={() => { setIsMfaRequired(false); setError(""); }} 
              className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancelar e ir atrás
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-[#0d2136] border border-[#163554] rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors" required />
                  <input type="text" placeholder="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-[#0d2136] border border-[#163554] rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors" required />
                </div>
              )}

              <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0d2136] border border-[#163554] rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors" required />

              <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0d2136] border border-[#163554] rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors" required minLength={6} />

              {!isLogin && (
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" required className="rounded bg-[#0d2136] border-[#163554] text-emerald-500" />
                  <span>Acepto términos HIPAA</span>
                </label>
              )}

              <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-[#07131f] font-bold text-base py-3.5 rounded-xl transition-all flex justify-center items-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Entrar" : "Crear Cuenta de Estudiante")}
              </button>
            </form>

            <div className="space-y-4 pt-4 border-t border-[#163554]">
              <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full bg-[#0d2136] border border-[#163554] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-[#163554] transition-all">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Acceder con Google
                  </>
                )}
              </button>

              <p className="text-center text-slate-400 text-sm">
                {isLogin ? "¿Nuevo en INTECA? " : "¿Ya tienes cuenta? "}
                <button type="button" onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-emerald-500 font-bold hover:underline">
                  {isLogin ? "Inscríbete aquí" : "Inicia sesión"}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}