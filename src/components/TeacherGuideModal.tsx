import React from 'react';
import { SimulationDef } from '../types/simulation';
import { soundFx } from '../utils/audio';
import { X, BookOpen, CheckCircle, HelpCircle, Sparkles, Printer } from 'lucide-react';

interface TeacherGuideModalProps {
  simulation: SimulationDef;
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherGuideModal: React.FC<TeacherGuideModalProps> = ({
  simulation,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const { teacherGuide, title, gradeLevel, categoryLabel } = simulation;

  const handlePrint = () => {
    soundFx.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800/40">
                  Guía Pedagógica Docente
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {gradeLevel}º Primaria • {categoryLabel}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">{title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Imprimir guía didáctica para la clase"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="py-6 space-y-6 text-sm">
          {/* Learning Objectives */}
          <div>
            <h3 className="text-base font-bold text-cyan-300 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-cyan-400" />
              Objetivos de Aprendizaje
            </h3>
            <ul className="space-y-2 text-slate-200 pl-2">
              {teacherGuide.learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Inquiry Questions */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <h3 className="text-base font-bold text-amber-300 mb-2 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              Preguntas para Abrir el Diálogo en Clase
            </h3>
            <ul className="space-y-2 text-slate-200">
              {teacherGuide.suggestedQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Vocabulary / Glossary */}
          {teacherGuide.vocabulary && teacherGuide.vocabulary.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-purple-300 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Vocabulario Científico Clave
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {teacherGuide.vocabulary.map((voc, i) => (
                  <div key={i} className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs">
                    <p className="font-bold text-purple-200 text-sm">{voc.word}</p>
                    <p className="text-slate-300 mt-1 leading-snug">{voc.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hands-on classroom activity */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-700/50">
            <h3 className="text-base font-bold text-emerald-300 mb-1 flex items-center gap-2">
              <span>🧪</span> Actividad Práctica Sugerida para el Aula
            </h3>
            <p className="text-emerald-100 leading-relaxed text-xs sm:text-sm">
              {teacherGuide.classroomActivity}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
          >
            Cerrar Guía Docente
          </button>
        </div>
      </div>
    </div>
  );
};
