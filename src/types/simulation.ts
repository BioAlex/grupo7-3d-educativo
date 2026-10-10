export type GradeLevel = '1-2' | '3-4' | '5-6';

export type ScienceCategory =
  | 'astronomia'
  | 'ecologia_biologia'
  | 'fisica_materia'
  | 'tierra_geologia'
  | 'quimica_atomos'
  | 'tecnologia_maquinas'
  | 'general';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type SceneElementType =
  | 'sphere'
  | 'box'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'ring'
  | 'plane'
  | 'particle_system'
  | 'arrow'
  | 'cutaway_sphere'
  | 'water_surface'
  | 'magnetic_field'
  | 'sun_glow'
  | 'leaf_shape'
  | 'cloud_group';

export interface ElementAnimation {
  type:
    | 'rotate'
    | 'orbit'
    | 'float'
    | 'pulse'
    | 'flow'
    | 'vibrate'
    | 'particle_fountain'
    | 'particle_rain'
    | 'expand_contract'
    | 'magnetic_flux'
    | 'balance_tilt';
  speed?: number;
  axis?: 'x' | 'y' | 'z';
  amplitude?: number;
  orbitCenter?: [number, number, number];
  orbitRadius?: number;
}

export interface ParameterModulation {
  paramId: string;
  property:
    | 'scale'
    | 'color'
    | 'opacity'
    | 'speed'
    | 'position_y'
    | 'position_x'
    | 'count'
    | 'rotation_z'
    | 'emissive_intensity';
  minVal: number;
  maxVal: number;
  targetColor?: string;
  sourceColor?: string;
}

export interface SceneElement {
  id: string;
  name: string;
  type: SceneElementType;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color: string;
  material?: 'standard' | 'glow' | 'transparent' | 'phong' | 'water' | 'wireframe';
  opacity?: number;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  animation?: ElementAnimation;
  tooltip?: string;
  explanation: string;
  funFact: string;
  clickable?: boolean;
  cutawayLayer?: number;
  parameterModulated?: ParameterModulation;
  secondaryId?: string;
}

export interface SimulationParameter {
  id: string;
  name: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  icon?: string;
  description: string;
  stateLabels?: { [key: string]: string };
}

export interface StepGuideItem {
  title: string;
  instruction: string;
  highlightElementId?: string;
  suggestedParamState?: Record<string, number>;
}

export interface ScientificMission {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  rewardBadge: string;
}

export interface TeacherGuide {
  learningObjectives: string[];
  suggestedQuestions: string[];
  vocabulary?: { word: string; meaning: string }[];
  classroomActivity: string;
}

export interface SimulationDef {
  id: string;
  title: string;
  gradeLevel: GradeLevel | string;
  category: ScienceCategory | string;
  categoryLabel: string;
  description: string;
  icon?: string;
  color: string;
  camera: {
    position: [number, number, number];
    fov: number;
    lookAt: [number, number, number];
  };
  environment: {
    background: string;
    fogColor?: string;
    fogDensity?: number;
    groundColor?: string;
    ambientLightColor?: string;
    ambientLightIntensity?: number;
    mainLightPosition?: [number, number, number];
    mainLightIntensity?: number;
    stars?: boolean;
  };
  elements: SceneElement[];
  parameters: SimulationParameter[];
  stepGuide?: StepGuideItem[];
  missions: ScientificMission[];
  teacherGuide: TeacherGuide;
}
