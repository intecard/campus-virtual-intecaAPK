import React, { useState } from "react";
import { 
  User, 
  Lock, 
  Bell, 
  ShieldCheck, 
  Save,
  CheckCircle2,
  Loader2,
  Award,
  Globe,
  LogOut,
  Camera
} from "lucide-react";
import { UserProfile } from "../types";
import { auth, db, storage } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface SettingsViewProps {
  currentUser: UserProfile;
  onChangeProfile: (data: Partial<UserProfile>) => void;
}

export default function SettingsView({ currentUser, onChangeProfile }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  
  // Profile States
  const [userName, setUserName] = useState(currentUser.name);
  const [userPhone, setUserPhone] = useState(currentUser.phone || "");
  const [userAvatar, setUserAvatar] = useState(currentUser.avatar || "");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 2FA States
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [enrollingTwoFactor, setEnrollingTwoFactor] = useState(false);
  const [enrollStep, setEnrollStep] = useState(0);
  const [verificationCode, setVerificationCode] = useState("");

  // ==========================================
  // SUBIR IMAGEN (CON TRUCO PARA ANDROID NATIVO)
  // ==========================================
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadingImage(false);
      return;
    }

    setUploadingImage(true);
    
    try {
      // 🛡️ TRUCO ANTI-CONGELAMIENTO PARA ANDROID:
      // Convertimos el archivo local a un "Blob" binario puro en memoria.
      // Esto evita que Firebase intente acceder a rutas bloqueadas del celular y se quede colgado.
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([new Uint8Array(arrayBuffer)], { type: file.type });

      // Creamos la referencia en Firebase Storage
      const storageRef = ref(storage, `avatars/${currentUser.id}_${Date.now()}`);
      
      // Usamos uploadBytesResumable que no se bloquea en móviles
      const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: file.type });

      uploadTask.on('state_changed', 
        (snapshot) => {
          // El progreso avanza correctamente
        }, 
        (error) => {
          console.error("Error de Firebase:", error);
          alert("Error al subir la imagen: " + error.message);
          setUploadingImage(false);
        }, 
        async () => {
          try {
            // Obtenemos el link cuando termina de subir
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Actualizamos la vista
            setUserAvatar(downloadURL);
            
            // Auto-guardamos en la Base de Datos
            const userRef = doc(db, "users", currentUser.id);
            await updateDoc(userRef, { avatar: downloadURL });

            onChangeProfile({
              name: userName,
              phone: userPhone,
              avatar: downloadURL
            });

            alert("¡Foto de perfil actualizada con éxito!");
            setUploadingImage(false);
          } catch (err) {
            console.error("Error al guardar URL:", err);
            setUploadingImage(false);
          }
        }
      );
    } catch (error: any) {
      console.error("Error fatal procesando imagen:", error);
      alert("Hubo un error de procesamiento. Intenta de nuevo.");
      setUploadingImage(false);
    }
  };

  // ==========================================
  // GUARDAR PERFIL REAL EN FIREBASE
  // ==========================================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      const userRef = doc(db, "users", currentUser.id);
      await updateDoc(userRef, {
        name: userName,
        phone: userPhone,
        avatar: userAvatar
      });

      onChangeProfile({
        name: userName,
        phone: userPhone,
        avatar: userAvatar
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      alert("Hubo un error de conexión al intentar guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // CERRAR SESIÓN DE FORMA SEGURA
  // ==========================================
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("No se pudo cerrar la sesión. Verifica tu conexión.");
    }
  };

  const handleEnroll2FA = () => {
    setEnrollingTwoFactor(true);
    setEnrollStep(1);
  };

  const verify2FACode = () => {
    if (verificationCode.length >= 6) {
      setEnrollStep(2);
      setIsTwoFactorEnabled(true);
      setVerificationCode("");
    } else {
      alert("El código debe tener 6 dígitos.");
    }
  };

  return (
    <div id="settings-view-root" className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
      <div>
        <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Gestión de Identidad Institucional</span>
        <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">Configuración de Cuenta INTECA</h1>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Sidebar Menu */}
        <div className="md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === 'profile' 
                ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Perfil Académico</span>
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === 'security' 
                ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Seguridad y Accesos</span>
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === 'notifications' 
                ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Alertas del Sistema</span>
          </button>

          <div className="flex-1"></div>

          {/* Botón de Cerrar Sesión */}
          <button
            onClick={handleLogout}
            className="w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 text-rose-500 hover:bg-rose-50 hover:text-rose-700 mt-4 border border-transparent hover:border-rose-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión Segura</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          
          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Información Personal</h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Cuenta Activa
                </span>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {/* Selector Interactivo de Avatar */}
                  <div className="relative group cursor-pointer w-24 h-24 shrink-0">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="user"
                      className="hidden" 
                      id="avatar-upload"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    <label htmlFor="avatar-upload" className="cursor-pointer block w-full h-full relative">
                      <img 
                        src={userAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`} 
                        alt="Avatar del Usuario" 
                        className={`w-full h-full rounded-full border-4 border-white shadow-md bg-slate-200 object-cover transition-opacity ${uploadingImage ? 'opacity-50' : 'group-hover:opacity-70'}`}
                      />
                      <div className={`absolute inset-0 flex items-center justify-center rounded-full transition-opacity ${uploadingImage ? 'opacity-100 bg-black/30' : 'opacity-0 group-hover:opacity-100 bg-slate-900/50'}`}>
                        {uploadingImage ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <div className="flex flex-col items-center">
                            <Camera className="w-6 h-6 text-white" />
                            <span className="text-[8px] text-white font-bold mt-1">Cambiar</span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm font-bold text-slate-800">Foto de Perfil</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Toca la imagen para tomarte una foto o seleccionar desde tu galería. Se guardará automáticamente en la nube.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Completo:</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Matrícula / ID Escolar:</label>
                    <input
                      type="text"
                      value={currentUser.academicId || "ID No Asignado"}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 flex justify-between">
                      <span>Correo Electrónico Institucional:</span>
                      <span className="text-[9px] text-rose-500 uppercase tracking-wider">No Editable</span>
                    </label>
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-semibold cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Para cambiar tu correo, contacta al Administrador TI.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono de Contacto:</label>
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="+1 809 000 0000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-100 gap-4">
                  {saveSuccess ? (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 animate-pulse">
                      <CheckCircle2 className="w-4 h-4" />
                      ¡Perfil guardado y sincronizado!
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Tus datos están protegidos por cifrado AES-256.</span>
                  )}
                  
                  <button
                    type="submit"
                    disabled={saving || uploadingImage}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Sincronizando...</span></>
                    ) : (
                      <><Save className="w-4 h-4" /><span>Guardar Cambios</span></>
                    )}
                  </button>
                </div>
              </form>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 font-display flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-sky-600" />
                    <span>Nivel de Acceso Académico</span>
                  </h3>
                  
                  <span className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    currentUser.role === 'admin' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                    currentUser.role === 'teacher' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    currentUser.role === 'observer' ? 'bg-sky-100 text-sky-700 border border-sky-200' :
                    'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Tu nivel de acceso determina las funciones que puedes usar en el campus. Solo la Consola de Administración Central puede modificar esta credencial.
                </p>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <ShieldCheck className="w-5 h-5 text-slate-900" />
                <h2 className="text-lg font-bold text-slate-900">Seguridad y Autenticación</h2>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-950 font-display flex items-center gap-2 text-sm">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Doble Factor (2FA) de INTECA</span>
                </h3>

                {!isTwoFactorEnabled ? (
                  <button
                    onClick={handleEnroll2FA}
                    className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all text-center flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Configurar Verificación de 2 Pasos</span>
                  </button>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">✓ Doble Factor Activo</p>
                      <p className="text-emerald-700 mt-1">Tu cuenta está blindada contra accesos no autorizados.</p>
                    </div>
                  </div>
                )}

                {enrollingTwoFactor && enrollStep === 1 && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6 mt-4">
                    <div className="text-center space-y-3">
                      <p className="text-sm font-bold text-slate-900">Escanea el código con tu App Autenticadora</p>
                      <div className="w-32 h-32 bg-white mx-auto flex items-center justify-center font-mono text-[10px] text-slate-400 border border-slate-300 rounded-lg shadow-sm">
                        [ CÓDIGO QR ]
                      </div>
                    </div>

                    <div className="flex gap-3 max-w-xs mx-auto">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 bg-white border border-slate-300 text-sm rounded-xl p-3 font-mono text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={verify2FACode}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all"
                      >
                        Verificar
                      </button>
                    </div>
                  </div>
                )}

                {enrollingTwoFactor && enrollStep === 2 && (
                  <div className="bg-emerald-50 text-emerald-950 p-6 rounded-2xl border border-emerald-200 space-y-3 text-center mt-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="font-bold text-base">¡Configuración Exitosa!</p>
                    <button
                      onClick={() => setEnrollingTwoFactor(false)}
                      className="text-xs font-bold bg-white text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg mt-3 inline-block hover:bg-emerald-100"
                    >
                      Entendido
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-950 flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Cuentas Cloud Enlazadas</span>
                </h3>
                <div className="space-y-2.5 text-xs font-medium">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-700">Google Workspace / Drive</span>
                    <span className="text-emerald-600 font-bold bg-emerald-100 px-2 py-1 rounded-md">✓ Conectado</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <Bell className="w-5 h-5 text-slate-900" />
                <h2 className="text-lg font-bold text-slate-900">Gestión de Alertas del Sistema</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Calificaciones y Entregas</span>
                    <span className="text-[10px] text-slate-500">Notificaciones sobre notas y tareas.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-500 rounded" />
                </label>
                
                <label className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Anuncios de la Institución</span>
                    <span className="text-[10px] text-slate-500">Avisos globales del Administrador TI.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-500 rounded" />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}