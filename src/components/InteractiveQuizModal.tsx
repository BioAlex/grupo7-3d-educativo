import React, { useState, useEffect } from 'react';
import { COMPREHENSIVE_QUIZ_BANK, QuizQuestion } from '../data/quizQuestions';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  X,
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  ChevronRight,
  RotateCcw,
  Star,
  Printer,
  Compass,
  Lightbulb,
} from 'lucide-react';

interface InteractiveQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTopicId?: string;
  currentTopicTitle?: string;
}

export const InteractiveQuizModal: React.FC<InteractiveQuizModalProps> = ({
  isOpen,
  onClose,
  currentTopicId,
  currentTopicTitle,
}) => {
  const [mode, setMode] = useState<'current' | 'all'>('current');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [studentName, setStudentName] = useState<string>('');

  // Prepare questions on mount or mode change
  useEffect(() => {
    let pool = COMPREHENSIVE_QUIZ_BANK;

    if (mode === 'current' && currentTopicId) {
      const topicMatches = pool.filter((q) => q.topicId === currentTopicId);
      pool = topicMatches.length > 0 ? topicMatches : pool;
    }

    if (selectedGrade !== 'all') {
      const gradeMatches = pool.filter((q) => q.gradeLevel === selectedGrade);
      if (gradeMatches.length > 0) pool = gradeMatches;
    }

    // Shuffle and pick up to 5-8 questions
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setCurrentQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowHint(false);
    setIsCompleted(false);
    setEarnedBadges([]);
  }, [mode, selectedGrade, currentTopicId, isOpen]);

  if (!isOpen) return null;

  const currentQ: QuizQuestion | undefined = currentQuestions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswered || !currentQ) return;
    soundFx.playClick();
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentQ.correctIndex) {
      soundFx.playSuccess();
      setScore((prev) => prev + 1);
      setEarnedBadges((prev) => [...prev, currentQ.badge]);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#fbbf24', '#34d399', '#f43f5e', '#a855f7'],
      });
    }
  };

  const handleNextQuestion = () => {
    soundFx.playClick();
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowHint(false);
    } else {
      // Completed!
      soundFx.playSuccess();
      setIsCompleted(true);
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#fbbf24', '#34d399', '#f43f5e', '#a855f7'],
      });
    }
  };

  const handleRestart = () => {
    soundFx.playClick();
    const shuffled = [...currentQuestions].sort(() => Math.random() - 0.5);
    setCurrentQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowHint(false);
    setIsCompleted(false);
    setEarnedBadges([]);
  };

  const starsCount =
    currentQuestions.length > 0
      ? Math.max(1, Math.round((score / currentQuestions.length) * 3))
      : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl text-white max-h-[92vh] overflow-y-auto transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/40">
                  Desafío Científico Interactivo
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {mode === 'current'
                    ? currentTopicTitle || 'Tema Actual'
                    : 'Maratón Escolar (Todos los Temas)'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Quiz de Ciencias Primaria
              </h2>
            </div>
          </div>

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

        {/* Mode & Grade Selector Bar */}
        {!isCompleted && (
          <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 text-xs">
            {/* Mode switch */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setMode('current');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  mode === 'current'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Este Tema 🔬
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setMode('all');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  mode === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Todos los Temas 🌟
              </button>
            </div>

            {/* Score & Progress Badges */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 font-bold">
                ⭐ {score} / {currentQuestions.length} Puntos
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                Pregunta {currentIndex + 1} de {currentQuestions.length}
              </span>
            </div>
          </div>
        )}

        {/* Question View */}
        {!isCompleted && currentQ && (
          <div className="py-4 space-y-4">
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 via-amber-400 to-emerald-400 h-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / currentQuestions.length) * 100}%`,
                }}
              />
            </div>

            {/* Topic Badge & Question text */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
                  {currentQ.topicTitle} • {currentQ.gradeLevel}º Primaria
                </span>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setShowHint(!showHint);
                  }}
                  className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{showHint ? 'Ocultar Pista' : '¿Necesitas una pista?'}</span>
                </button>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                {currentQ.question}
              </h3>

              {/* Hint Callout */}
              {showHint && (
                <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs leading-relaxed animate-in fade-in">
                  💡 <strong className="text-white">Pista Científica:</strong> {currentQ.hint}
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrectOption = idx === currentQ.correctIndex;

                let btnClass =
                  'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-slate-100 hover:border-slate-600';

                if (isAnswered) {
                  if (isCorrectOption) {
                    btnClass =
                      'bg-emerald-600/90 border-emerald-400 text-white font-bold shadow-lg shadow-emerald-950/50';
                  } else if (isSelected) {
                    btnClass =
                      'bg-rose-600/80 border-rose-400 text-white font-medium';
                  } else {
                    btnClass = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm text-left transition-all flex items-center justify-between gap-3 ${btnClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-xl bg-slate-900/60 font-mono font-bold flex items-center justify-center text-xs shrink-0 border border-white/10">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {isAnswered && (
                      <span>
                        {isCorrectOption ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
                        ) : isSelected ? (
                          <XCircle className="w-5 h-5 text-rose-200 shrink-0" />
                        ) : null}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation card upon answering */}
            {isAnswered && (
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed animate-in fade-in ${
                  selectedOption === currentQ.correctIndex
                    ? 'bg-emerald-950/40 border border-emerald-700/50 text-emerald-200'
                    : 'bg-rose-950/40 border border-rose-700/50 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-sm mb-1">
                  <span>
                    {selectedOption === currentQ.correctIndex
                      ? '🎉 ¡Respuesta Correcta!'
                      : '🤔 ¡Casi! Pero mira por qué:'}
                  </span>
                  {selectedOption === currentQ.correctIndex && (
                    <span className="text-amber-300 text-xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Medalla: {currentQ.badge}
                    </span>
                  )}
                </div>
                <p className="text-slate-200">{currentQ.explanation}</p>
              </div>
            )}

            {/* Footer action button */}
            {isAnswered && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
                >
                  <span>
                    {currentIndex < currentQuestions.length - 1
                      ? 'Siguiente Pregunta'
                      : 'Ver Resultados Finales 🏆'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Completion Screen (Diploma & Score) */}
        {isCompleted && (
          <div className="py-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-400 to-cyan-400 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20 animate-bounce">
              🏆
            </div>

            <div>
              <div className="flex items-center justify-center gap-1 text-amber-400 text-2xl mb-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-7 h-7 ${
                      i < starsCount ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <h3 className="text-2xl font-black text-white">¡Misión Científica Cumplida!</h3>
              <p className="text-sm text-slate-300 mt-1">
                Has obtenido <strong className="text-amber-300">{score}</strong> de{' '}
                <strong>{currentQuestions.length}</strong> respuestas correctas.
              </p>
            </div>

            {/* Certificate Box */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border-2 border-amber-500/40 text-left relative overflow-hidden shadow-2xl">
              <div className="absolute top-2 right-2 text-6xl opacity-10 pointer-events-none">
                🧪
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-indigo-800/40 mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                  Diploma de Reconocimiento Escolar
                </span>
                <span className="text-xs font-semibold text-slate-400">SimulaCiencia 3D</span>
              </div>

              <p className="text-xs text-slate-300">Se certifica con honores a:</p>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Escribe tu nombre aquí..."
                className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950/80 border border-amber-500/40 text-amber-200 font-bold text-sm focus:outline-none focus:border-amber-400"
              />

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                Por demostrar curiosidad, pensamiento científico y resolver con éxito el desafío
                interactivo de conceptos científicos de primaria.
              </p>

              {/* Medals list */}
              {earnedBadges.length > 0 && (
                <div className="mt-4 pt-3 border-t border-indigo-800/40">
                  <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
                    Medallas Ganadas:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {earnedBadges.map((b, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-600/40 text-[11px] text-amber-200 font-bold"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reintentar Quiz</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  window.print();
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar Diploma</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition-colors"
              >
                Volver a la Simulación 3D ✨
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
