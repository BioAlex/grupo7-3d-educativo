import React, { useState } from 'react';
import { ScientificMission } from '../types/simulation';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, XCircle, Sparkles, RefreshCw } from 'lucide-react';

interface MissionsPanelProps {
  missions: ScientificMission[];
}

export const MissionsPanel: React.FC<MissionsPanelProps> = ({ missions }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [completedMissions, setCompletedMissions] = useState<Record<string, boolean>>({});

  const handleSelectOption = (mission: ScientificMission, optionIndex: number) => {
    soundFx.playClick();
    setSelectedAnswers((prev) => ({ ...prev, [mission.id]: optionIndex }));

    if (optionIndex === mission.correctIndex) {
      soundFx.playSuccess();
      setCompletedMissions((prev) => ({ ...prev, [mission.id]: true }));

      // Trigger colorful kid confetti!
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#fbbf24', '#34d399', '#f43f5e', '#a855f7'],
      });
    }
  };

  const handleReset = () => {
    soundFx.playClick();
    setSelectedAnswers({});
    setCompletedMissions({});
  };

  const completedCount = Object.keys(completedMissions).length;

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-800 text-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">Misiones Científicas</h3>
            <p className="text-[11px] text-slate-400">¡Pon a prueba tus descubrimientos y gana medallas!</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 font-bold text-xs">
            {completedCount} / {missions.length} Superadas
          </span>
          {completedCount > 0 && (
            <button
              onClick={handleReset}
              title="Volver a intentar"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mission Cards */}
      <div className="space-y-4">
        {missions.map((mission, idx) => {
          const selectedOption = selectedAnswers[mission.id];
          const isAnswered = selectedOption !== undefined;
          const isCorrect = selectedOption === mission.correctIndex;

          return (
            <div
              key={mission.id}
              className={`p-4 rounded-2xl border transition-all ${
                isCorrect
                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-emerald-950/20 shadow-md'
                  : isAnswered
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider bg-slate-900/60 px-2 py-0.5 rounded-md">
                  Misión {idx + 1}
                </span>
                {isCorrect && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-600/40 animate-bounce">
                    <Sparkles className="w-3 h-3" /> {mission.rewardBadge}
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-slate-100 mb-3 leading-snug">
                {mission.question}
              </p>

              {/* Options */}
              <div className="space-y-2">
                {mission.options.map((opt, optIdx) => {
                  const isThisSelected = selectedOption === optIdx;
                  let btnStyle = 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200';

                  if (isThisSelected) {
                    btnStyle = optIdx === mission.correctIndex
                      ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                      : 'bg-rose-600/80 text-white border-rose-400';
                  } else if (isAnswered && optIdx === mission.correctIndex) {
                    btnStyle = 'bg-emerald-900/40 border-emerald-500/50 text-emerald-200';
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isCorrect}
                      onClick={() => handleSelectOption(mission, optIdx)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {isThisSelected && (
                        <span>
                          {optIdx === mission.correctIndex ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-200 shrink-0" />
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Explanation */}
              {isAnswered && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs leading-relaxed ${
                    isCorrect
                      ? 'bg-emerald-900/30 text-emerald-200 border border-emerald-700/50'
                      : 'bg-rose-900/30 text-rose-200 border border-rose-700/50'
                  }`}
                >
                  <p className="font-bold mb-0.5">
                    {isCorrect ? '🎉 ¡Correcto!' : '🤔 Casi... ¡Piénsalo otra vez!'}
                  </p>
                  <p>{mission.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
