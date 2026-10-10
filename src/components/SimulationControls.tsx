import React from 'react';
import { SimulationDef, StepGuideItem } from '../types/simulation';
import { soundFx } from '../utils/audio';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';

interface SimulationControlsProps {
  simulation: SimulationDef;
  parameterValues: Record<string, number>;
  onParameterChange: (paramId: string, value: number) => void;
  onResetParameters: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  simulation,
  parameterValues,
  onParameterChange,
  onResetParameters,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onSpeedChange,
  currentStepIndex,
  onStepChange,
  soundEnabled,
  onToggleSound,
  voiceEnabled,
  onToggleVoice,
}) => {
  const stepGuide = simulation.stepGuide || [];
  const activeStep: StepGuideItem | undefined = stepGuide[currentStepIndex];

  const handleNextStep = () => {
    if (currentStepIndex < stepGuide.length - 1) {
      soundFx.playClick();
      const nextIdx = currentStepIndex + 1;
      onStepChange(nextIdx);
      const step = stepGuide[nextIdx];
      if (step?.suggestedParamState) {
        Object.entries(step.suggestedParamState).forEach(([pId, val]) => {
          onParameterChange(pId, val);
        });
      }
      if (step && voiceEnabled) {
        soundFx.speak(step.instruction);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      soundFx.playClick();
      const prevIdx = currentStepIndex - 1;
      onStepChange(prevIdx);
      const step = stepGuide[prevIdx];
      if (step?.suggestedParamState) {
        Object.entries(step.suggestedParamState).forEach(([pId, val]) => {
          onParameterChange(pId, val);
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-800 text-white shadow-2xl">
      {/* Top Playback Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundFx.playClick();
              onTogglePlay();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" /> Pausar
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Continuar
              </>
            )}
          </button>

          {/* Speed selector */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  soundFx.playClick();
                  onSpeedChange(spd);
                }}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  playbackSpeed === spd
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onResetParameters();
            }}
            title="Reiniciar valores"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Audio controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onToggleSound();
              soundFx.playClick();
            }}
            title={soundEnabled ? 'Silenciar sonidos de efectos' : 'Activar efectos de sonido'}
            className={`p-1.5 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              onToggleVoice();
              soundFx.playClick();
            }}
            title={voiceEnabled ? 'Voz de lectura en español activa' : 'Activar lectura por voz'}
            className={`px-2 py-1 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
              voiceEnabled
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <span>🗣️</span> {voiceEnabled ? 'Voz ON' : 'Voz OFF'}
          </button>
        </div>
      </div>

      {/* Guided Classroom Steps (Pedagogical progression) */}
      {stepGuide.length > 0 && activeStep && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/50 to-blue-950/50 border border-cyan-800/50 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-cyan-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Guía Escolar • Paso {currentStepIndex + 1} de {stepGuide.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={handleNextStep}
                disabled={currentStepIndex === stepGuide.length - 1}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <p className="font-semibold text-white">{activeStep.title}</p>
          <p className="text-slate-300 mt-0.5 leading-relaxed">{activeStep.instruction}</p>
        </div>
      )}

      {/* Interactive Science Sliders */}
      <div className="space-y-3 pt-1">
        <h4 className="text-xs font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
          <span>🎛️</span> Parámetros Científicos Experimentales
        </h4>

        {simulation.parameters.map((param) => {
          const val = parameterValues[param.id] ?? param.defaultValue;

          // Find state description label if available
          let stateLabel = '';
          if (param.stateLabels) {
            const thresholds = Object.keys(param.stateLabels)
              .map(Number)
              .sort((a, b) => a - b);
            for (const t of thresholds) {
              if (val >= t) {
                stateLabel = param.stateLabels[t.toString()];
              }
            }
            if (!stateLabel && thresholds.length > 0) {
              stateLabel = param.stateLabels[thresholds[0].toString()];
            }
          }

          return (
            <div
              key={param.id}
              className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  {param.name}
                </label>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 text-cyan-300 font-mono font-bold text-xs border border-slate-700">
                  {val} {param.unit || ''}
                </span>
              </div>

              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={val}
                onChange={(e) => {
                  soundFx.playClick();
                  onParameterChange(param.id, parseFloat(e.target.value));
                }}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
              />

              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>
                  {param.min} {param.unit}
                </span>
                <span>
                  {param.max} {param.unit}
                </span>
              </div>

              {stateLabel && (
                <div className="mt-1.5 px-2 py-1 rounded bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200 font-medium animate-in fade-in">
                  {stateLabel}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
