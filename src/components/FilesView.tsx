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
  Link as LinkIcon
} from "lucide-react";
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";

// Definición local extendida para soportar URLs reales
export interface RealCloudFile {
  id: string;
  name: string;
  size: string;
  type: string;
  source: string;
  modifiedAt: string;
  version: number;
  url?: string;
}

export default function FilesView() {
  const [activeDrive, setActiveDrive] = useState<'All' | 'Drive' | 'OneDrive' | 'Dropbox' | 'INTECA Cloud'>('All');
  const [selectedPreview, setSelectedPreview] = useState<RealCloudFile | null>(null);
  
  // Estados de Firebase
  const [files, setFiles] = useState<RealCloudFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del Modal de Subida
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFile, setNewFile] = useState({ name: '', url: '', source: 'INTECA Cloud' });

  // 1. CARGAR ARCHIVOS EN TIEMPO REAL DESDE FIREBASE
  useEffect(() => {
    const q = query(collection(db, "cloud_files"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedFiles: RealCloudFile[] = [];
      snapshot.forEach((doc) => {
        loadedFiles.push({ id: doc.id, ...doc.data() } as RealCloudFile);
      });
      setFiles(loadedFiles);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredFiles = activeDrive === 'All' ? files : files.filter(f => f.source === activeDrive);

  // 2. SUBIR NUEVO ARCHIVO A LA BASE DE DATOS
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile.name || !newFile.url) return;
    
    setUploading(true);

    // Auto-detectar tipo de archivo por la extensión en el nombre
    const lowerName = newFile.name.toLowerCase();
    const type = lowerName.endsWith(".pdf") ? "pdf" 
               : lowerName.match(/\.(png|jpg|jpeg)$/) ? "image" 
               : lowerName.match(/\.(mp4|mov)$/) ? "video" 
               : lowerName.match(/\.(xls|xlsx)$/) ? "xls" 
               : "doc";

    try {
      await addDoc(collection(db, "cloud_files"), {
        name: newFile.name,
        url: newFile.url,
        source: newFile.source,
        type,
        size: "Enlace Externo", // Al ser enlace, el peso está en la nube original
        modifiedAt: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
        version: 1,
        createdAt: serverTimestamp()
      });
      setShowUploadModal(false);
      setNewFile({ name: '', url: '', source: 'INTECA Cloud' });
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      alert("Hubo un error al guardar el archivo.");
    } finally {
      setUploading(false);
    }
  };

  // 3. ELIMINAR ARCHIVO
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("¿Seguro que deseas eliminar este archivo de la biblioteca para todos los usuarios?")) {
      try {
        await deleteDoc(doc(db, "cloud_files", id));
      } catch (error) {
        console.error("Error eliminando archivo:", error);
      }
    }
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
        <div className="w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
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
          <p className="text-xs text-slate-500 mt-1">Este tipo de archivo ({file.type.toUpperCase()}) requiere abrirse en su plataforma original.</p>
        </div>
        <a 
          href={file.url || "#"} 
          target="_blank" 
          rel="noreferrer"
          className="inline-block bg-slate-900 hover:bg-black text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md"
        >
          Abrir Enlace Original
        </a>
      </div>
    );
  };

  return (
    <div id="files-view-root" className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Header */}
      <div id="files-view-title-flex" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider">Gestor de Recursos de Aprendizaje</span>
          <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">Biblioteca Cloud Colectiva</h1>
        </div>
        
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 w-fit"
        >
          <Upload className="w-4 h-4" />
          <span>Vincular Recurso Técnico</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
        {[
          { name: 'All', label: 'Todos los Archivos', icon: HardDrive },
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
          <div className="flex gap-12 mr-6">
            <span className="hidden md:inline">Origen</span>
            <span className="hidden md:inline">Versión</span>
            <span className="text-center w-20">Acciones</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Sincronizando Nube...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <FolderClosed className="w-12 h-12 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No hay archivos en esta ubicación</p>
            <p className="text-xs text-slate-400">Presiona "Vincular Recurso" para agregar el primero.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFiles.map((file) => (
              <div 
                key={file.id} 
                className="p-4 flex justify-between items-center text-xs hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex items-center gap-3 overflow-hidden pr-4">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-900 leading-none truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{file.size} • Agregado: {file.modifiedAt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-10 shrink-0">
                  <span className="hidden md:inline font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {file.source}
                  </span>
                  <span className="hidden md:inline font-mono font-bold text-slate-700">
                    v{file.version}.0
                  </span>
                  <div className="flex gap-2 w-20 justify-end">
                    <button 
                      onClick={() => setSelectedPreview(file)}
                      className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
                      title="Vista Previa"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(file.id, e)}
                      className="p-1.5 bg-rose-500/10 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar Archivo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE SUBIDA */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-500" />
                Vincular Recurso a la Nube
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre del Archivo (con extensión)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Manual_Farmacologia.pdf"
                  value={newFile.name}
                  onChange={e => setNewFile({...newFile, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Enlace / URL de origen</label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="url" 
                    required
                    placeholder="https://drive.google.com/..."
                    value={newFile.url}
                    onChange={e => setNewFile({...newFile, url: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Plataforma de Origen</label>
                <select 
                  value={newFile.source}
                  onChange={e => setNewFile({...newFile, source: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="INTECA Cloud">INTECA Local Cloud</option>
                  <option value="Drive">Google Drive</option>
                  <option value="OneDrive">Microsoft OneDrive</option>
                  <option value="Dropbox">Dropbox</option>
                </select>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Sincronizando..." : "Guardar en Base de Datos"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA */}
      {selectedPreview && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 space-y-6">
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