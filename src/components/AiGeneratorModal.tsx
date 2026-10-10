import React, { useState } from 'react';
import { SimulationDef, GradeLevel, ScienceCategory } from '../types/simulation';
import { soundFx } from '../utils/audio';
import { generateSmartSimulation } from '../utils/dynamicSimGenerator';
import { Sparkles, Wand2, X, Lightbulb, Compass, Loader2 } from 'lucide-react';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulationGenerated: (simulation: SimulationDef) => void;
}

const INSPIRATION_IDEAS = [
  {
    topic: 'Cómo se forma el arcoíris al refractarse la luz del Sol en las gotas de lluvia',
    grade: '3-4' as GradeLevel,
    category: 'fisica_materia' as ScienceCategory,
    badge: '🌈 Luz y Óptica',
  },
  {
    topic: 'Por qué flotan los barcos pesados y el principio de flotabilidad y densidad',
    grade: '3-4' as GradeLevel,
    category: 'fisica_materia' as ScienceCategory,
    badge: '⛵ Flotabilidad',
  },
  {
    topic: 'Las 4 fases principales de la Luna y cómo ocurre un eclipse solar',
    grade: '4-6' as GradeLevel,
    category: 'astronomia' as ScienceCategory,
    badge: '🌙 Fases de la Luna',
  },
  {
    topic: 'Cómo viajan las ondas del sonido por el aire hasta vibrar en el tímpano',
    grade: '3-4' as GradeLevel,
    category: 'fisica_materia' as ScienceCategory,
    badge: '🔊 Ondas de Sonido',
  },
  {
    topic: 'El corazón humano como una bomba que impulsa la sangre por todo el cuerpo',
    grade: '4-6' as GradeLevel,
    category: 'ecologia_biologia' as ScienceCategory,
    badge: '🫀 Sistema Circulatorio',
  },
  {
    topic: 'El átomo y cómo el hidrógeno y oxígeno se unen para formar la molécula de agua H2O',
    grade: '5-6' as GradeLevel,
    category: 'quimica_atomos' as ScienceCategory,
    badge: '⚛️ Átomos y Moléculas',
  },
];

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSimulationGenerated,
}) => {
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('3-4');
  const [category, setCategory] = useState<ScienceCategory>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectIdea = (idea: (typeof INSPIRATION_IDEAS)[0]) => {
    soundFx.playClick();
    setTopic(idea.topic);
    setGradeLevel(idea.grade);
    setCategory(idea.category);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    soundFx.playMagic();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          gradeLevel,
          category,
        }),
      });

      const data = await response.json();

      if (data && data.simulation) {
        soundFx.playSuccess();
        onSimulationGenerated(data.simulation);
        onClose();
        return;
      }

      // If server returned non-standard payload, use intelligent client generator
      const smartSimulation = generateSmartSimulation(topic, gradeLevel, category);
      soundFx.playSuccess();
      onSimulationGenerated(smartSimulation);
      onClose();
    } catch (err: any) {
      console.info('Using local pedagogical simulation generator:', err?.message);
      const smartSimulation = generateSmartSimulation(topic, gradeLevel, category);
      soundFx.playSuccess();
      onSimulationGenerated(smartSimulation);
      onClose();
    } finally {
      setIsLoading(false);
    }
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/20">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
                  Generación Automatizada 3D
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                Crear Nueva Simulación Científica
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="py-5 space-y-5">
          {/* Topic prompt input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🔬</span> ¿Qué concepto científico deseas que exploren los estudiantes?
            </label>
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: Cómo se forman los arcoíris con la refracción de la luz solar en las gotas de lluvia..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-white placeholder-slate-500 text-sm transition-all focus:outline-none"
              disabled={isLoading}
            />
          </div>

          {/* Grade Level and Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Nivel Escolar (Primaria)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '1-2', label: '1º y 2º', age: '6-8 años' },
                  { id: '3-4', label: '3º y 4º', age: '8-10 años' },
                  { id: '5-6', label: '5º y 6º', age: '10-12 años' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setGradeLevel(g.id as GradeLevel);
                    }}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      gradeLevel === g.id
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <p className="text-xs font-bold">{g.label}</p>
                    <p className="text-[10px] opacity-80">{g.age}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Área de Ciencias
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ScienceCategory)}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-medium focus:border-cyan-400 focus:outline-none"
              >
                <option value="general">Ciencias Naturales General</option>
                <option value="fisica_materia">Física y Fuerzas</option>
                <option value="ecologia_biologia">Biología y Vida</option>
                <option value="tierra_geologia">Geología y Tierra</option>
                <option value="astronomia">Astronomía y Universo</option>
                <option value="quimica_atomos">Química y Materia</option>
                <option value="tecnologia_maquinas">Máquinas y Tecnología</option>
              </select>
            </div>
          </div>

          {/* Inspiration Chips */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Ideas Populares del Currículo Primario:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {INSPIRATION_IDEAS.map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectIdea(idea)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <span>{idea.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !topic.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Construyendo Mundo 3D...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>¡Generar Simulación 3D!</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
