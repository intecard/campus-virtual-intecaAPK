import React, { useState, useEffect } from "react";
import { 
  FolderClosed, 
  Upload, 
  FileText, 
  FileDown, 
  Eye, 
  Clock, 
  Cloud,
  HardDrive,
  X,
  Trash2,
  Loader2,
  Download,
  FileUp,
  ShieldCheck,
  Copy,
  CheckCircle2
} from "lucide-react";
import { db, storage, logUserActivity } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { ref, getDownloadURL, deleteObject, uploadBytesResumable } from "firebase/storage";
import { UserProfile } from "../types";

interface FilesViewProps {
  currentUser: UserProfile;
}

export interface RealCloudFile {
  id: string;
  name: string;
  size: string;
  type: string;
  source: string;
  modifiedAt: string;
  version: number;
  url?: string;
  storagePath?: string;
  uploaderId?: string;
  uploadedBy?: string;
  uploaderRole?: string;
}

export default function FilesView({ currentUser }: FilesViewProps) {
  const [activeDrive, setActiveDrive] = useState<'All' | 'Drive' | 'OneDrive' | 'Dropbox' | 'INTECA Cloud'>('All');
  const [selectedPreview, setSelectedPreview] = useState<RealCloudFile | null>(null);
  
  // Estados de Firebase
  const [files, setFiles] = useState<RealCloudFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del Modal de Subida y Progreso
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lógica de Roles
  const isMaster = currentUser.email?.toLowerCase() === "luisramirezescalante1985@gmail.com";
  const isAdmin = currentUser.role === 'admin' || isMaster;
  const isTeacher = currentUser.role === 'teacher';

  // 1. CARGAR ARCHIVOS EN TIEMPO REAL DESDE FIREBASE (CON FILTRO DE ROLES)
  useEffect(() => {
    const q = query(collection(db, "cloud_files"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let loadedFiles: RealCloudFile[] = [];
      snapshot.forEach((doc) => {
        loadedFiles.push({ id: doc.id, ...doc.data() } as RealCloudFile);
      });

      // REGLA DE SEGURIDAD: Si no es admin, solo ve sus propios archivos
      if (!isAdmin) {
        loadedFiles = loadedFiles.filter(f => f.uploaderId === currentUser.id);
      }

      setFiles(loadedFiles);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, isAdmin]);

  const filteredFiles = activeDrive === 'All' ? files : files.filter(f => f.source === activeDrive);

  // 2. SUBIR NUEVO ARCHIVO FÍSICO A FIREBASE STORAGE (CON BARRA DE PROGRESO)
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    
    setUploading(true);
    setUploadProgress(0);

    try {
      // 2.1 Crear ruta única en Firebase Storage
      const storagePath = `cloud_files/${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, storagePath);

      // 2.2 Subir el archivo físico con Resumable para ver el progreso
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error) => {
          console.error("Error subiendo archivo:", error);
          alert("Hubo un error al subir el archivo. Verifica tu conexión.");
          setUploading(false);
        }, 
        async () => {
          // 2.3 Obtener la URL de descarga pública
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // 2.4 Auto-detectar tipo de archivo por la extensión
          const lowerName = selectedFile.name.toLowerCase();
          const type = lowerName.endsWith(".pdf") ? "pdf" 
                    : lowerName.match(/\.(png|jpg|jpeg|gif)$/) ? "image" 
                    : lowerName.match(/\.(mp4|mov|webm)$/) ? "video" 
                    : lowerName.match(/\.(xls|xlsx|csv)$/) ? "xls" 
                    : lowerName.match(/\.(zip|rar|tar)$/) ? "zip"
                    : "doc";

          // 2.5 Calcular peso legible (MB o KB)
          const sizeInMB = selectedFile.size / (1024 * 1024);
          const displaySize = sizeInMB > 1 
            ? `${sizeInMB.toFixed(2)} MB` 
            : `${(selectedFile.size / 1024).toFixed(0)} KB`;

          // 2.6 Guardar registro en la base de datos Firestore
          await addDoc(collection(db, "cloud_files"), {
            name: selectedFile.name,
            url: downloadURL,
            storagePath: storagePath,
            source: 'INTECA Cloud',
            type,
            size: displaySize,
            modifiedAt: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
            version: 1,
            uploaderId: currentUser.id,
            uploadedBy: currentUser.name,
            uploaderRole: currentUser.role,
            createdAt: serverTimestamp()
          });

          if (typeof logUserActivity === 'function') {
            await logUserActivity(
              currentUser.id, currentUser.name, currentUser.email, currentUser.role,
              "FILE_UPLOAD", `Subió el archivo: ${selectedFile.name}`
            );
          }
          
          setShowUploadModal(false);
          setSelectedFile(null);
          setUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error("Error:", error);
      setUploading(false);
    }
  };

  // 3. ELIMINAR ARCHIVO (CONTROL DE ROLES)
  const handleDelete = async (file: RealCloudFile, e: React.MouseEvent) => {
    e.stopPropagation();

    // Seguridad: Admin borra todo. Prof/Estudiante solo borran lo suyo.
    if (!isAdmin && file.uploaderId !== currentUser.id) {
      alert("Acceso denegado: Solo puedes eliminar los archivos que tú mismo has subido.");
      return;
    }

    if (window.confirm("¿Seguro que deseas eliminar este archivo permanentemente?")) {
      try {
        await deleteDoc(doc(db, "cloud_files", file.id));
        
        if (file.storagePath) {
          const storageRef = ref(storage, file.storagePath);
          await deleteObject(storageRef);
        }

        if (typeof logUserActivity === 'function') {
          await logUserActivity(
            currentUser.id, currentUser.name, currentUser.email, currentUser.role,
            "FILE_DELETE", `Eliminó el archivo: ${file.name}`
          );
        }
      } catch (error) {
        console.error("Error eliminando archivo:", error);
      }
    }
  };

  const copyToClipboard = (url: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 4. RENDERIZAR VISTA PREVIA REAL
  const getFilePreviewContent = (file: RealCloudFile) => {
    if (file.type === 'pdf') {
      return (
        <div className="w-full h-[60vh] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
          {file.url ? (
            <iframe src={file.url} className="w-full h-full" title={file.name}></iframe>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">URL no disponible</div>
          )}
        </div>
      );
    }

    if (file.type === 'video') {
      return (
        <div className="w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {file.url ? (
            <video src={file.url} controls className="w-full h-auto max-h-[60vh]"></video>
          ) : (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm">URL no disponible</div>
          )}
        </div>
      );
    }

    if (file.type === 'image') {
      return (
        <div className="w-full flex justify-center bg-slate-100 rounded-xl overflow-hidden border border-slate-200 p-4">
          <img src={file.url} alt={file.name} className="max-h-[60vh] object-contain rounded-lg shadow-sm" />
        </div>
      );
    }

    return (
      <div className="py-12 text-center space-y-4 bg-slate-50 rounded-xl border border-slate-200">
        <FileText className="w-16 h-16 text-emerald-500 mx-auto" />
        <div>
          <p className="text-sm font-bold text-slate-800">Vista previa nativa no disponible</p>
          <p className="text-xs text-slate-500 mt-1">Este tipo de archivo ({file.type.toUpperCase()}) requiere descargarse para visualizarse.</p>
        </div>
        <a 
          href={file.url || "#"} 
          target="_blank" 
          rel="noreferrer"
          className="inline-block bg-slate-900 hover:bg-black text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 max-w-[200px] mx-auto"
        >
          <Download className="w-4 h-4" />
          Descargar Archivo
        </a>
      </div>
    );
  };

  // Títulos dinámicos según el rol
  const getViewHeaders = () => {
    if (isAdmin) return {
      badge: "Monitoreo y Gestión Global",
      title: "Biblioteca Cloud Administrativa",
      uploadText: "Subir Recurso Global"
    };
    if (isTeacher) return {
      badge: "Material de Apoyo y Tareas",
      title: "Gestor de Recursos Docentes",
      uploadText: "Subir Tarea / Material"
    };
    return {
      badge: "Repositorio Personal",
      title: "Mis Entregas y Documentos",
      uploadText: "Subir Archivo de Tarea"
    };
  };

  const headers = getViewHeaders();

  return (
    <div id="files-view-root" className="space-y-6 animate-in fade-in duration-500 relative pb-10">
      
      {/* Header Dinámico */}
      <div id="files-view-title-flex" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            {isAdmin && <ShieldCheck className="w-3.5 h-3.5" />} {headers.badge}
          </span>
          <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">{headers.title}</h1>
        </div>
        
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 w-fit"
        >
          <Upload className="w-4 h-4" />
          <span>{headers.uploadText}</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
        {[
          { name: 'All', label: isAdmin ? 'Todos los Archivos' : 'Mis Archivos', icon: HardDrive },
          { name: 'Drive', label: 'Google Drive', icon: Cloud },
          { name: 'OneDrive', label: 'OneDrive', icon: Cloud },
          { name: 'Dropbox', label: 'Dropbox', icon: Cloud },
          { name: 'INTECA Cloud', label: 'INTECA Local Cloud', icon: Cloud },
        ].map((drv) => {
          const Icon = drv.icon;
          const isActive = activeDrive === drv.name;
          return (
            <button
              key={drv.name}
              onClick={() => setActiveDrive(drv.name as any)}
              className={`p-4 rounded-2xl border text-left transition-all space-y-2 shrink-0 ${isActive ? 'bg-slate-900 border-slate-800 text-white shadow-md' : 'bg-white border-slate-100 text-slate-700 hover:border-emerald-500/30'}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
              <p className="text-xs font-bold leading-none">{drv.label}</p>
            </button>
          );
        })}
      </div>

      {/* Lista de Archivos */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500 font-bold">
          <span>Nombre de Archivo</span>
          <div className="flex gap-4 md:gap-12 mr-6">
            <span className="hidden md:inline w-24 text-center">Autor</span>
            <span className="hidden md:inline w-20 text-center">Origen</span>
            <span className="text-center w-36">Acciones</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Sincronizando Nube...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <FolderClosed className="w-12 h-12 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No hay archivos en esta ubicación</p>
            <p className="text-xs text-slate-400 max-w-sm">Presiona "{headers.uploadText}" para subir un documento a la plataforma.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFiles.map((file) => (
              <div 
                key={file.id} 
                onClick={() => setSelectedPreview(file)}
                className="p-4 flex justify-between items-center text-xs hover:bg-slate-50/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3 overflow-hidden pr-4 flex-1">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-900 leading-none truncate" title={file.name}>{file.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{file.size} • Agregado: {file.modifiedAt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 md:gap-12 shrink-0">
                  {/* Etiqueta de Autor (Solo útil para admin) */}
                  <div className="hidden md:flex w-24 justify-center">
                    {isAdmin && file.uploadedBy && (
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold uppercase truncate max-w-[80px]" title={file.uploadedBy}>
                        {file.uploadedBy}
                      </span>
                    )}
                  </div>

                  <span className="hidden md:inline w-20 text-center font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                    {file.source}
                  </span>
                  
                  <div className="flex gap-2 w-36 justify-end">
                    
                    {/* Botón Copiar Enlace */}
                    {file.url && (
                      <button 
                        onClick={(e) => copyToClipboard(file.url!, file.id, e)}
                        className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                        title="Copiar Enlace"
                      >
                        {copiedId === file.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Botón Descargar */}
                    {file.url && (
                      <a 
                        href={file.url} 
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-sky-500/10 text-sky-600 rounded-lg hover:bg-sky-600 hover:text-white transition-colors"
                        title="Descargar"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPreview(file);
                      }}
                      className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
                      title="Vista Previa"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    
                    {/* Botón Eliminar (Visible solo si es Admin o si el usuario lo subió) */}
                    {(isAdmin || file.uploaderId === currentUser.id) && (
                      <button 
                        onClick={(e) => handleDelete(file, e)}
                        className="p-1.5 bg-rose-500/10 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar Archivo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE SUBIDA FÍSICA CON PROGRESO */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-500" />
                Subir Archivo a INTECA
              </h3>
              <button onClick={() => setShowUploadModal(false)} disabled={uploading} className="text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-4">
              
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 hover:border-emerald-500/50 transition-colors cursor-pointer relative group">
                <input 
                  type="file" 
                  required
                  disabled={uploading}
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-emerald-500 transition-colors" />
                <p className="text-xs font-bold text-slate-700">
                  {selectedFile ? selectedFile.name : 'Toca para seleccionar un archivo'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB listos para subir` : 'PDF, Word, Excel, Imágenes, Videos o ZIP'}
                </p>
              </div>

              {/* Barra de progreso en el modal */}
              {uploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-emerald-600">
                    <span>Subiendo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={uploading || !selectedFile}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Procesando..." : "Subir Archivo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA NATIVA */}
      {selectedPreview && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <FolderClosed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm md:text-base">{selectedPreview.name}</h3>
                  <p className="text-[10px] text-slate-400">Origen: {selectedPreview.source} • Versión {selectedPreview.version}.0</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPreview(null)}
                className="p-1.5 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              {getFilePreviewContent(selectedPreview)}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5" />
                Auditoría: Enlace Verificado
              </span>
              <button 
                onClick={() => setSelectedPreview(null)}
                className="bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all shadow-md"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}