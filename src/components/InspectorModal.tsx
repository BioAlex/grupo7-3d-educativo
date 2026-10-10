import React, { useEffect, useState } from 'react';
import { SceneElement } from '../types/simulation';
import { soundFx } from '../utils/audio';
import { X, Volume2, Sparkles, HelpCircle, CheckCircle } from 'lucide-react';

interface InspectorModalProps {
  element: SceneElement | null;
  onClose: () => void;
  voiceEnabled: boolean;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({ element, onClose, voiceEnabled }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (element && voiceEnabled) {
      handleReadAloud();
    }
    return () => {
      soundFx.stopSpeaking();
      setIsSpeaking(false);
    };
  }, [element?.id]);

  if (!element) return null;

  const handleReadAloud = () => {
    setIsSpeaking(true);
    const speechText = `${element.name}. ${element.explanation}. ¿Sabías que? ${element.funFact}`;
    soundFx.speak(speechText, () => setIsSpeaking(false));
  };

  const handleStopAloud = () => {
    soundFx.stopSpeaking();
    setIsSpeaking(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-white transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/20"
              style={{ backgroundColor: element.color }}
            >
              🔬
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
                Elemento Científico 3D
              </span>
              <h3 className="text-xl font-extrabold text-white mt-0.5">{element.name}</h3>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              soundFx.stopSpeaking();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Explanation */}
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 leading-relaxed text-slate-200 text-sm">
            <p className="font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              ¿Qué es y cómo funciona?
            </p>
            <p className="text-slate-100">{element.explanation}</p>
          </div>

          {/* Fun Fact */}
          {element.funFact && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-yellow-950/30 border border-amber-600/40 text-amber-100 text-sm">
              <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>¿Sabías que...?</span>
              </div>
              <p className="leading-relaxed">{element.funFact}</p>
            </div>
          )}

          {/* Inquiry question for kids */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-700/40 text-indigo-200 text-xs flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Pregunta para investigar:</strong> Mueve los controles de la
              simulación para ver cómo cambia {element.name.toLowerCase()} cuando ajustas los parámetros.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              soundFx.playClick();
              if (isSpeaking) {
                handleStopAloud();
              } else {
                handleReadAloud();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              isSpeaking
                ? 'bg-purple-600 text-white animate-pulse'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isSpeaking ? 'Pausar Lectura' : 'Escuchar Explicación 🗣️'}</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              soundFx.stopSpeaking();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg"
          >
            ¡Entendido! Seguir explorando ✨
          </button>
        </div>
      </div>
    </div>
  );
};
