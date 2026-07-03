import { useState } from "react";
import { 
  FolderClosed, 
  Upload, 
  FileText, 
  FileDown, 
  Eye, 
  Clock, 
  CheckCircle2, 
  Cloud,
  ChevronRight,
  HardDrive,
  X,
  FileCode,
  Image,
  Video
} from "lucide-react";
import { CloudFile } from "../types";

export default function FilesView() {
  const [activeDrive, setActiveDrive] = useState<'All' | 'Drive' | 'OneDrive' | 'Dropbox' | 'INTECA Cloud'>('All');
  const [selectedPreview, setSelectedPreview] = useState<CloudFile | null>(null);
  
  const [files, setFiles] = useState<CloudFile[]>([
    { id: "f1", name: "Guia_Soporte_Vital_Avanzado_2026.pdf", size: "4.2 MB", type: "pdf", source: "INTECA Cloud", modifiedAt: "Ayer, 14:20", version: 2 },
    { id: "f2", name: "Plano_Red_Telecomunicaciones_Sedes.dwg", size: "18.5 MB", type: "doc", source: "Drive", modifiedAt: "Hace 3 días, 09:12", version: 1 },
    { id: "f3", name: "Estudio_Caso_Ransomware_Hospitals.xlsx", size: "1.4 MB", type: "xls", source: "OneDrive", modifiedAt: "14 Jun 2026", version: 3 },
    { id: "f4", name: "Configuracion_Red_Inalámbrica_Rural.txt", size: "12 KB", type: "doc", source: "Dropbox", modifiedAt: "10 Jun 2026", version: 1 },
    { id: "f5", name: "Slide_Seguridad_Cifrado_IPsec.pptx", size: "8.1 MB", type: "ppt", source: "INTECA Cloud", modifiedAt: "08 Jun 2026", version: 4 },
    { id: "f6", name: "Simulacro_Triaje_Clinico_Video.mp4", size: "85 MB", type: "video", source: "Drive", modifiedAt: "01 Jun 2026", version: 1 }
  ]);

  const filteredFiles = activeDrive === 'All' ? files : files.filter(f => f.source === activeDrive);

  const triggerUpload = () => {
    const name = prompt("Ingrese el nombre del archivo técnico para subir al Cloud:");
    if (!name) return;
    const type = name.endsWith(".pdf") ? "pdf" : name.endsWith(".png") || name.endsWith(".jpg") ? "image" : name.endsWith(".mp4") ? "video" : "doc";
    
    const newFile: CloudFile = {
      id: "f" + (files.length + 1),
      name,
      size: "2.1 MB",
      type,
      source: activeDrive === 'All' ? 'INTECA Cloud' : activeDrive,
      modifiedAt: "Hoy, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      version: 1
    };

    setFiles(prev => [newFile, ...prev]);
  };

  const getFilePreviewContent = (file: CloudFile) => {
    switch (file.type) {
      case 'pdf':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 font-sans text-xs space-y-3 text-slate-700">
              <p className="font-bold border-b pb-2 text-brand-blue uppercase">Guía de Procedimientos Clínicos Emergencias 2026</p>
              <p><strong>Sección 1.1:</strong> Definición de teleasistencia paramédica en tránsito.</p>
              <p>Al despachar la ambulancia en el Caribe rural, se debe establecer redundancia satelital de inmediato. Los signos vitales (ECG, Presión Arterial, Saturación de Oxígeno) se transmiten en ráfagas cifradas AES cada 3 segundos hacia el centro médico de base.</p>
              <p><strong>Criterio de Evaluación:</strong> Latencia aceptable máxima: 120ms. Si supera 400ms, conmutar a codificación de audio analógico comprimido.</p>
            </div>
            <p className="text-[10px] text-slate-400 text-center">Mostrando página 1 de 24 • Documento Oficial Registrado</p>
          </div>
        );
      case 'xls':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 border-b">
                    <th className="p-2 text-left">Nodo Sede</th>
                    <th className="p-2 text-left">IP Asignada</th>
                    <th className="p-2 text-left">Latencia Promedio</th>
                    <th className="p-2 text-left">Riesgo DDoS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">Cartagena Central</td>
                    <td className="p-2">10.12.0.1</td>
                    <td className="p-2">12ms</td>
                    <td className="p-2 text-emerald-600 font-bold">Bajo</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Sede Riohacha</td>
                    <td className="p-2">10.12.4.1</td>
                    <td className="p-2">45ms</td>
                    <td className="p-2 text-amber-600 font-bold">Medio</td>
                  </tr>
                  <tr>
                    <td className="p-2">Ambulancia Movil 1</td>
                    <td className="p-2">172.16.8.24</td>
                    <td className="p-2">115ms</td>
                    <td className="p-2 text-rose-600 font-bold">Alto</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 text-center">Hoja: Telemetría_Nodos_Red • Versión {file.version}</p>
          </div>
        );
      default:
        return (
          <div className="py-8 text-center space-y-3">
            <FileText className="w-16 h-16 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-600">Este tipo de archivo requiere un visor nativo externo. Descárguelo para abrirlo.</p>
            <button className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl">Descargar {file.size}</button>
          </div>
        );
    }
  };

  return (
    <div id="files-view-root" className="space-y-6">
      {/* Title */}
      <div id="files-view-title-flex" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-brand-green uppercase tracking-wider">Gestor de Recursos de Aprendizaje</span>
          <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">Biblioteca Cloud Colectiva</h1>
        </div>
        
        <button
          onClick={triggerUpload}
          className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-brand-green/20 w-fit"
        >
          <Upload className="w-4 h-4" />
          <span>Subir Recurso Técnico</span>
        </button>
      </div>

      {/* Cloud Providers Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
              className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${isActive ? 'bg-brand-blue border-brand-blue-light/50 text-white shadow-md' : 'bg-white border-slate-100 text-slate-700 hover:border-brand-green/30'}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-brand-green' : 'text-slate-400'}`} />
              <p className="text-xs font-bold leading-none">{drv.label}</p>
            </button>
          );
        })}
      </div>

      {/* Files Table List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500 font-bold">
          <span>Nombre de Archivo</span>
          <div className="flex gap-12 mr-6">
            <span className="hidden md:inline">Origen</span>
            <span className="hidden md:inline">Versión</span>
            <span>Acciones</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredFiles.map((file) => (
            <div 
              key={file.id} 
              className="p-4 flex justify-between items-center text-xs hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 leading-none">{file.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{file.size} • Modificado: {file.modifiedAt}</p>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <span className="hidden md:inline font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {file.source}
                </span>
                <span className="hidden md:inline font-mono font-bold text-slate-700">
                  v{file.version}.0
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedPreview(file)}
                    className="p-1.5 bg-brand-green/10 text-brand-green rounded-lg hover:bg-brand-green hover:text-white transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => alert(`Iniciando descarga segura de: ${file.name}`)}
                    className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal Overlay */}
      {selectedPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderClosed className="w-5 h-5 text-brand-green" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm md:text-base">{selectedPreview.name}</h3>
                  <p className="text-[10px] text-slate-400">Origen: {selectedPreview.source} • Versión {selectedPreview.version}.0</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPreview(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body content depending on type */}
            <div>
              {getFilePreviewContent(selectedPreview)}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Auditoría de Versiones: Sincronizado</span>
              </span>
              <button 
                onClick={() => setSelectedPreview(null)}
                className="bg-slate-900 hover:bg-black text-white text-xs font-bold py-2 px-5 rounded-xl transition-all"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
