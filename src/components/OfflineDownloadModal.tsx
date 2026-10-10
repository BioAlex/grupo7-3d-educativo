import React, { useState } from 'react';
import { soundFx } from '../utils/audio';
import { downloadOfflineProjectZip } from '../utils/offlinePackager';
import {
  X,
  Download,
  WifiOff,
  Server,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface OfflineDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineDownloadModal: React.FC<OfflineDownloadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    soundFx.playMagic();
    setIsDownloading(true);
    setStatusMessage('Iniciando empaquetado...');

    try {
      await downloadOfflineProjectZip((status) => {
        setStatusMessage(status);
      });
      soundFx.playSuccess();
    } catch (err) {
      console.error('Error generating zip:', err);
      setStatusMessage('Error al generar el ZIP. Reintenta o clona directamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
              <WifiOff className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                  Modo 100% Desconectado / Local
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                Descargar para Red Local sin Internet
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            disabled={isDownloading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-5 text-sm">
          {/* Main Action Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-cyan-950/40 to-slate-900 border border-emerald-500/30">
            <h3 className="font-bold text-emerald-300 text-sm mb-1 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-400" />
              Descargar Repositorio Completo en Formato ZIP
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed mb-3">
              Incluye todos los archivos fuente, las 8 simulaciones 3D, librerías gráficas locales y los lanzadores de un solo clic (<code className="text-emerald-300">iniciar_escuela.bat</code> y <code className="text-emerald-300">iniciar_escuela.sh</code>).
            </p>

            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{statusMessage || 'Generando archivo ZIP...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Repositorio (.ZIP) para Uso Escolar</span>
                </>
              )}
            </button>
          </div>

          {/* 3 Simple Steps */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>📋</span> Pasos para ponerlo en marcha en el aula:
            </h4>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-100 text-xs">Descomprimir en la PC del colegio</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Extrae el archivo ZIP en una carpeta de la computadora o servidor del aula.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-100 text-xs">Ejecutar el Lanzador de 1 Clic</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    En Windows haz doble clic en <strong className="text-emerald-300">iniciar_escuela.bat</strong>. En Linux / Raspberry Pi ejecuta <strong className="text-emerald-300">./iniciar_escuela.sh</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-100 text-xs">¡Conectar las Tablets de los Alumnos!</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Los alumnos abren su navegador en la red local e ingresan la IP de la computadora maestra:
                  </p>
                  <div className="mt-2 p-2 rounded-lg bg-slate-950 font-mono text-cyan-300 text-xs flex items-center justify-between border border-slate-800">
                    <span>http://192.168.1.XX:3000</span>
                    <span className="text-[10px] text-slate-500">Puerto 3000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Terminal Alternative */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Comandos de terminal estándar (Opcional):
              </span>
              <button
                onClick={() => copyToClipboard('npm install && npm run build && npx vite preview --host', 'cmd')}
                className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
              >
                {copiedCmd === 'cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCmd === 'cmd' ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 text-slate-300 text-xs font-mono overflow-x-auto border border-slate-800">
              <code>npm install{'\n'}npm run build{'\n'}npx vite preview --host 0.0.0.0 --port 3000</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Sin claves de API, sin internet, 100% privado y seguro.
          </p>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
