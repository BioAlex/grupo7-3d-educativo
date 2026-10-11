import React from 'react';
import { SimulationDef, GradeLevel } from '../types/simulation';
import { soundFx } from '../utils/audio';
import {
  BookOpen,
  Maximize2,
  Minimize2,
  Camera,
  Layers,
  ChevronDown,
  Award,
} from 'lucide-react';

interface HeaderProps {
  simulations: SimulationDef[];
  activeSimulation: SimulationDef;
  onSelectSimulation: (simulation: SimulationDef) => void;
  selectedGrade: string;
  onSelectGrade: (grade: string) => void;
  onOpenTeacherGuide: () => void;
  onOpenQuiz: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onTakeSnapshot: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  simulations,
  activeSimulation,
  onSelectSimulation,
  selectedGrade,
  onSelectGrade,
  onOpenTeacherGuide,
  onOpenQuiz,
  isFullscreen,
  onToggleFullscreen,
  onTakeSnapshot,
}) => {
  const filteredSimulations = simulations.filter(
    (sim) => selectedGrade === 'all' || sim.gradeLevel === selectedGrade
  );

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-3 sm:px-6 py-2.5 sm:py-3 z-30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
      {/* Brand & Simulation Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-md shadow-cyan-500/20">
            🪐
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-sm sm:text-base tracking-tight text-white">
                SimulaCiencia <span className="text-cyan-400">3D</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.2 rounded-full bg-cyan-950 border border-cyan-800 text-[10px] font-extrabold text-cyan-300">
                PRIMARIA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Laboratorio de Ciencias Interactivas
            </p>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="relative group ml-1">
          <select
            value={activeSimulation.id}
            onChange={(e) => {
              const target = simulations.find((s) => s.id === e.target.value);
              if (target) {
                soundFx.playClick();
                onSelectSimulation(target);
              }
            }}
            className="appearance-none bg-slate-800 hover:bg-slate-750 text-slate-100 text-xs font-bold pl-3 pr-8 py-2 rounded-xl border border-slate-700/80 focus:border-cyan-400 focus:outline-none transition-colors cursor-pointer max-w-[200px] sm:max-w-[260px] truncate"
          >
            {filteredSimulations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Grade Level Filter Tabs */}
      <div className="hidden lg:flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/80 text-xs">
        {[
          { id: 'all', label: 'Todos' },
          { id: '1-2', label: '1º-2º' },
          { id: '3-4', label: '3º-4º' },
          { id: '5-6', label: '5º-6º' },
        ].map((grade) => (
          <button
            key={grade.id}
            onClick={() => {
              soundFx.playClick();
              onSelectGrade(grade.id);
            }}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              selectedGrade === grade.id
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {grade.label}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Interactive Quiz Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenQuiz();
          }}
          title="Abrir Quiz Científico Interactivo con Diploma y Medallas"
          className="px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95"
        >
          <Award className="w-4 h-4 text-slate-950" />
          <span>Quiz Interactivo</span>
        </button>

        {/* Take Screenshot */}
        <button
          onClick={() => {
            soundFx.playClick();
            onTakeSnapshot();
          }}
          title="Capturar foto del experimento"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Toggle Fullscreen / Pizarra Interactiva */}
        <button
          onClick={() => {
            soundFx.playClick();
            onToggleFullscreen();
          }}
          title={isFullscreen ? 'Salir de pantalla completa' : 'Modo Pizarra Digital (Pantalla Completa)'}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Teacher Guide */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenTeacherGuide();
          }}
          className="px-3 sm:px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
        >
          <BookOpen className="w-4 h-4 text-white" />
          <span className="hidden sm:inline">Guía Docente</span>
        </button>
      </div>
    </header>
  );
};
