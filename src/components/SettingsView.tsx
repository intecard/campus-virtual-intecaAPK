import { useState } from "react";
import { 
  User, 
  ShieldCheck, 
  Lock, 
  Bell, 
  Globe, 
  Award, 
  CheckCircle2, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { UserProfile, UserRole } from "../types";

interface SettingsViewProps {
  currentUser: UserProfile;
  onChangeProfile: (profile: Partial<UserProfile>) => void;
  onChangeRole: (role: UserRole) => void;
}

export default function SettingsView({ 
  currentUser, 
  onChangeProfile,
  onChangeRole 
}: SettingsViewProps) {
  // Input states
  const [userName, setUserName] = useState(currentUser.name);
  const [userEmail, setUserEmail] = useState(currentUser.email);
  const [userAvatar, setUserAvatar] = useState(currentUser.avatar);

  // 2FA state
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [enrollingTwoFactor, setEnrollingTwoFactor] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [enrollStep, setEnrollStep] = useState(1);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    setTimeout(() => {
      onChangeProfile({
        name: userName,
        email: userEmail,
        avatar: userAvatar
      });
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

  const handleEnroll2FA = () => {
    setEnrollingTwoFactor(true);
    setEnrollStep(1);
    setVerificationCode("");
  };

  const verify2FACode = () => {
    if (verificationCode === "123456" || verificationCode.length === 6) {
      setEnrollStep(2);
      setIsTwoFactorEnabled(true);
    } else {
      alert("Código incorrecto. Digite un código numérico de 6 dígitos (ej: 123456).");
    }
  };

  return (
    <div id="settings-view-root" className="space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-mono font-bold text-brand-green uppercase tracking-wider">Ajustes de Perfil Escolar</span>
        <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">Configuración y Seguridad</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal details form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-950 font-display flex items-center gap-2">
              <User className="w-5 h-5 text-brand-blue" />
              <span>Información del Perfil Académico</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-brand-green focus:bg-white focus:outline-none transition-all font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Matrícula / Cédula Escolar:</label>
                  <input
                    type="text"
                    value={currentUser.academicId}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Correo Electrónico de INTECA:</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-brand-green focus:bg-white focus:outline-none transition-all font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">URL de Foto de Perfil (Avatar):</label>
                <input
                  type="text"
                  value={userAvatar}
                  onChange={(e) => setUserAvatar(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-brand-green focus:bg-white focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                {saveSuccess ? (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 animate-pulse">
                    <CheckCircle2 className="w-4 h-4" />
                    ¡Perfil de INTECA guardado exitosamente!
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Última sincronización con Moodle: Hoy</span>
                )}
                
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-brand-blue hover:bg-brand-blue-light text-white text-xs font-bold py-2 px-5 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-brand-blue/10 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Role selector summary information */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-950 font-display flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-green" />
              <span>Privilegios Académicos de Rol</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tu rol asignado en los directorios del Instituto Técnico del Caribe es <strong className="text-brand-blue uppercase">{currentUser.role}</strong>. Para simular el comportamiento de otros estamentos educativos (Director, Profesor, Padre de familia, Alumno), use el selector de prueba en el margen izquierdo.
            </p>
          </div>
        </div>

        {/* Security & MFA */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-950 font-display flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-green" />
              <span>Doble Factor (2FA) de INTECA</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Garantiza la seguridad de tus calificaciones y accesos restringidos blindando tu cuenta escolar con autenticación en dos pasos.
            </p>

            {!isTwoFactorEnabled ? (
              <div className="space-y-4 pt-2">
                <button
                  onClick={handleEnroll2FA}
                  className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all text-center flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Configurar Verificación de 2 Pasos</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">✓ Doble Factor Activo</p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Tu cuenta escolar está respaldada por claves dinámicas generadas en tu celular.</p>
                </div>
              </div>
            )}

            {/* 2FA Enroll dialog simulation */}
            {enrollingTwoFactor && enrollStep === 1 && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 mt-2">
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold text-slate-900">Escanea o ingresa tu código de autenticación</p>
                  <div className="w-24 h-24 bg-slate-300 mx-auto flex items-center justify-center font-mono text-xs text-slate-600 border border-slate-400">
                    [ QR CODE ]
                  </div>
                  <p className="text-[10px] text-slate-400">Digita el código temporal de 6 dígitos que veas en tu App Autenticadora:</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 text-xs rounded-xl p-2 font-mono text-center focus:outline-none focus:ring-1 focus:ring-brand-green"
                  />
                  <button
                    onClick={verify2FACode}
                    className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                  >
                    Verificar
                  </button>
                </div>
              </div>
            )}

            {enrollingTwoFactor && enrollStep === 2 && (
              <div className="bg-emerald-50 text-emerald-950 p-4 rounded-2xl border border-emerald-200 space-y-2 text-xs text-center mt-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold">¡Configuración Exitosa!</p>
                <p className="text-[10px] text-emerald-700">El doble factor de verificación ha sido enlazado a tu dispositivo académico.</p>
                <button
                  onClick={() => setEnrollingTwoFactor(false)}
                  className="text-xs font-bold bg-white text-slate-800 border px-3 py-1.5 rounded-lg mt-2 inline-block hover:bg-slate-100"
                >
                  Entendido
                </button>
              </div>
            )}
          </div>

          {/* Cloud Storage integration status */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-950 flex items-center gap-2">
              <Globe className="w-5 h-5 text-brand-blue" />
              <span>Cuentas Cloud Enlazadas</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span>Google Classroom / Drive</span>
                <span className="text-brand-green font-bold">✓ Conectado</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span>Microsoft Teams / OneDrive</span>
                <span className="text-brand-green font-bold">✓ Conectado</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span>Dropbox Educativo</span>
                <span className="text-slate-400 font-medium">No enlazado</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
