/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { PRESET_SIMULATIONS } from './data/presetSimulations';
import { SimulationDef, SceneElement } from './types/simulation';
import { ThreeSimulationCanvas } from './components/ThreeSimulationCanvas';
import { SimulationControls } from './components/SimulationControls';
import { InspectorModal } from './components/InspectorModal';
import { MissionsPanel } from './components/MissionsPanel';
import { TeacherGuideModal } from './components/TeacherGuideModal';
import { OfflineDownloadModal } from './components/OfflineDownloadModal';
import { Header } from './components/Header';
import { soundFx } from './utils/audio';
import {
  Sparkles,
  Award,
  BookOpen,
  Sliders,
  ChevronRight,
  Info,
  Compass,
} from 'lucide-react';

export default function App() {
  const [simulationsList, setSimulationsList] = useState<SimulationDef[]>(PRESET_SIMULATIONS);
  const [activeSimulation, setActiveSimulation] = useState<SimulationDef>(PRESET_SIMULATIONS[0]);
  const [parameterValues, setParameterValues] = useState<Record<string, number>>({});
  const [selectedElement, setSelectedElement] = useState<SceneElement | null>(null);

  // Playback & Animation states
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Audio & narration toggles
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Filter & Modals
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [activeSideTab, setActiveSideTab] = useState<'controls' | 'missions' | 'info'>('controls');
  const [isTeacherGuideOpen, setIsTeacherGuideOpen] = useState<boolean>(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [snapshotFlash, setSnapshotFlash] = useState<boolean>(false);

  const appContainerRef = useRef<HTMLDivElement>(null);

  // Initialize parameter values when active simulation changes
  useEffect(() => {
    const initialParams: Record<string, number> = {};
    activeSimulation.parameters.forEach((p) => {
      initialParams[p.id] = p.defaultValue;
    });
    setParameterValues(initialParams);
    setCurrentStepIndex(0);
    setSelectedElement(null);

    // Speak introductory description if voice is enabled
    if (voiceEnabled) {
      soundFx.speak(`Simulación de ${activeSimulation.title}. ${activeSimulation.description}`);
    }
  }, [activeSimulation.id]);

  const handleParameterChange = (paramId: string, value: number) => {
    setParameterValues((prev) => ({ ...prev, [paramId]: value }));
  };

  const handleResetParameters = () => {
    const resetVals: Record<string, number> = {};
    activeSimulation.parameters.forEach((p) => {
      resetVals[p.id] = p.defaultValue;
    });
    setParameterValues(resetVals);
  };

  const handleSelectSimulation = (sim: SimulationDef) => {
    setActiveSimulation(sim);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      appContainerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleTakeSnapshot = () => {
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 300);

    // Grab canvas image and download for student activity
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `experimento-${activeSimulation.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div
      ref={appContainerRef}
      className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-cyan-500 selection:text-slate-950"
    >
      {/* Header Bar */}
      <Header
        simulations={simulationsList}
        activeSimulation={activeSimulation}
        onSelectSimulation={handleSelectSimulation}
        selectedGrade={selectedGrade}
        onSelectGrade={setSelectedGrade}
        onOpenTeacherGuide={() => setIsTeacherGuideOpen(true)}
        onOpenOfflineModal={() => setIsOfflineModalOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onTakeSnapshot={handleTakeSnapshot}
      />

      {/* Snapshot Visual Flash Effect */}
      {snapshotFlash && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none transition-opacity duration-300 opacity-80" />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left: 3D Simulation Viewport */}
        <div className="flex-1 relative h-[50vh] lg:h-full bg-slate-950 flex flex-col">
          <ThreeSimulationCanvas
            simulation={activeSimulation}
            parameterValues={parameterValues}
            onSelectElement={(elem) => setSelectedElement(elem)}
            selectedElementId={selectedElement?.id || null}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
          />

          {/* Floating Element Chips Bar at the bottom of the 3D canvas */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 overflow-x-auto pb-1 pointer-events-auto scrollbar-none">
            <span className="text-[11px] font-bold text-slate-300 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/80 shrink-0 flex items-center gap-1">
              <span>🔍</span> Toca un elemento:
            </span>
            {activeSimulation.elements.map((elem) => (
              <button
                key={elem.id}
                onClick={() => {
                  soundFx.playInspect();
                  setSelectedElement(elem);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all backdrop-blur-md flex items-center gap-1.5 shadow-md ${
                  selectedElement?.id === elem.id
                    ? 'bg-cyan-500 text-slate-950 border border-cyan-400 scale-105'
                    : 'bg-slate-900/80 text-slate-200 hover:bg-slate-800 border border-slate-700/80 hover:text-white'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: elem.color }}
                />
                <span>{elem.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Interactive Pedagogical Control Panel */}
        <div className="w-full lg:w-[420px] xl:w-[460px] bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-[50vh] lg:h-full overflow-hidden shadow-2xl z-20">
          {/* Side Tabs Selector */}
          <div className="grid grid-cols-3 p-2 bg-slate-950/70 border-b border-slate-800 gap-1">
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveSideTab('controls');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSideTab === 'controls'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Controles</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveSideTab('missions');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSideTab === 'missions'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Misiones ({activeSimulation.missions.length})</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveSideTab('info');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSideTab === 'info'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Concepto</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeSideTab === 'controls' && (
              <SimulationControls
                simulation={activeSimulation}
                parameterValues={parameterValues}
                onParameterChange={handleParameterChange}
                onResetParameters={handleResetParameters}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                playbackSpeed={playbackSpeed}
                onSpeedChange={setPlaybackSpeed}
                currentStepIndex={currentStepIndex}
                onStepChange={setCurrentStepIndex}
                soundEnabled={soundEnabled}
                onToggleSound={() => {
                  const n = !soundEnabled;
                  setSoundEnabled(n);
                  soundFx.setSoundEnabled(n);
                }}
                voiceEnabled={voiceEnabled}
                onToggleVoice={() => {
                  const n = !voiceEnabled;
                  setVoiceEnabled(n);
                  soundFx.setVoiceEnabled(n);
                }}
              />
            )}

            {activeSideTab === 'missions' && (
              <MissionsPanel missions={activeSimulation.missions} />
            )}

            {activeSideTab === 'info' && (
              <div className="space-y-4 text-xs">
                {/* Simulation Description */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-extrabold text-[10px]">
                      {activeSimulation.gradeLevel}º Primaria
                    </span>
                    <span className="text-slate-400 font-medium">
                      {activeSimulation.categoryLabel}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mb-2">
                    {activeSimulation.title}
                  </h3>
                  <p className="leading-relaxed text-slate-300 text-sm">
                    {activeSimulation.description}
                  </p>
                </div>

                {/* List of 3D Scene Elements */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span>🧩</span> Elementos presentes en la maqueta 3D:
                  </h4>
                  <div className="space-y-2">
                    {activeSimulation.elements.map((elem) => (
                      <div
                        key={elem.id}
                        onClick={() => {
                          soundFx.playInspect();
                          setSelectedElement(elem);
                        }}
                        className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-750 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: elem.color }}
                          />
                          <div>
                            <p className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                              {elem.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                              {elem.tooltip}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Teacher guide button trigger */}
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setIsTeacherGuideOpen(true);
                  }}
                  className="w-full py-3 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Ver Objetivos Didácticos y Guía para el Maestro</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Simulation Carousel at bottom of drawer */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1">
              <span>📚</span> Otras Simulaciones Curriculares:
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {simulationsList.map((sim) => (
                <button
                  key={sim.id}
                  onClick={() => {
                    soundFx.playClick();
                    handleSelectSimulation(sim);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 border ${
                    activeSimulation.id === sim.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span>
                    {sim.id === 'ciclo-agua'
                      ? '💧'
                      : sim.id === 'sistema-solar'
                      ? '🪐'
                      : sim.id === 'fotosintesis'
                      ? '🌱'
                      : sim.id === 'volcan-tierra'
                      ? '🌋'
                      : sim.id === 'magnetismo'
                      ? '🧲'
                      : sim.id === 'maquinas-simples'
                      ? '⚙️'
                      : sim.id === 'arcoiris'
                      ? '🌈'
                      : '⛵'}
                  </span>
                  <span className="truncate max-w-[120px]">{sim.title.split(' ')[1] || sim.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inspector Modal for clicked 3D objects */}
      <InspectorModal
        element={selectedElement}
        onClose={() => setSelectedElement(null)}
        voiceEnabled={voiceEnabled}
      />

      {/* Teacher Guide Modal */}
      <TeacherGuideModal
        simulation={activeSimulation}
        isOpen={isTeacherGuideOpen}
        onClose={() => setIsTeacherGuideOpen(false)}
      />

      {/* Offline LAN Download Modal */}
      <OfflineDownloadModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
      />
    </div>
  );
}
