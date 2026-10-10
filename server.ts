import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { generateSmartSimulation } from './src/utils/dynamicSimGenerator.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client with required User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint to generate 3D simulations tailored for primary school
app.post('/api/generate-simulation', async (req, res) => {
  const { topic, gradeLevel = '3-4', category = 'general' } = req.body;

  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'El tema de la simulación es requerido.' });
  }

  // If no API key is set, immediately respond with high-fidelity pedagogical simulation
  if (!apiKey) {
    console.info('GEMINI_API_KEY not configured, serving tailored educational 3D simulation');
    const simulation = generateSmartSimulation(topic, gradeLevel, category);
    return res.json({ success: true, fallback: true, simulation });
  }

  try {

    const systemInstruction = `Eres un pedagogo experto en ciencias naturales y desarrollador de simulaciones 3D interactivas para niños de educación primaria (6 a 12 años).
Tu objetivo es generar una especificación técnica de simulación 3D interactiva que sea visualmente atractiva, sencilla de comprender y científicamente pedagógica.
El lenguaje debe ser en ESPAÑOL, claro, entusiasta, adaptado al nivel de primaria (${gradeLevel}º de primaria).
Los elementos 3D se representan mediante primitivas geométricas ('sphere', 'box', 'cylinder', 'cone', 'torus', 'ring', 'plane', 'particle_system', 'arrow', 'cutaway_sphere') con coordenadas en rango [-8, 8], colores vivos atractivos para niños (#HEX), animaciones suaves ('rotate', 'orbit', 'float', 'pulse', 'particle_fountain', 'particle_rain') y parámetros ajustables (como temperatura, gravedad, velocidad, intensidad de luz, fuerza).
Debes incluir al menos 3 parámetros interactivos con explicaciones infantiles, 4-7 elementos 3D interactivos con datos curiosos ("¿Sabías que...?"), una guía paso a paso, 2 preguntas de desafío/misión con medallas y una guía docente.`;

    const prompt = `Crea una simulación 3D interactiva completa para el tema: "${topic}".
Nivel escolar: Primaria (${gradeLevel}º).
Categoría: ${category}.
Asegúrate de que las coordenadas espaciales distribuyan bien los objetos en el espacio 3D (para que no se encimen) y los colores sean llamativos y educativos.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            gradeLevel: { type: Type.STRING },
            category: { type: Type.STRING },
            categoryLabel: { type: Type.STRING },
            description: { type: Type.STRING },
            icon: { type: Type.STRING },
            color: { type: Type.STRING },
            camera: {
              type: Type.OBJECT,
              properties: {
                position: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                },
                fov: { type: Type.NUMBER },
                lookAt: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                },
              },
              required: ['position', 'fov', 'lookAt'],
            },
            environment: {
              type: Type.OBJECT,
              properties: {
                background: { type: Type.STRING },
                groundColor: { type: Type.STRING },
                ambientLightColor: { type: Type.STRING },
                ambientLightIntensity: { type: Type.NUMBER },
                stars: { type: Type.BOOLEAN },
              },
              required: ['background', 'ambientLightColor', 'ambientLightIntensity'],
            },
            elements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  position: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                  },
                  rotation: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                  },
                  scale: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                  },
                  color: { type: Type.STRING },
                  material: { type: Type.STRING },
                  opacity: { type: Type.NUMBER },
                  emissive: { type: Type.STRING },
                  emissiveIntensity: { type: Type.NUMBER },
                  animation: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      speed: { type: Type.NUMBER },
                      axis: { type: Type.STRING },
                      amplitude: { type: Type.NUMBER },
                    },
                    required: ['type'],
                  },
                  tooltip: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  funFact: { type: Type.STRING },
                  clickable: { type: Type.BOOLEAN },
                  parameterModulated: {
                    type: Type.OBJECT,
                    properties: {
                      paramId: { type: Type.STRING },
                      property: { type: Type.STRING },
                      minVal: { type: Type.NUMBER },
                      maxVal: { type: Type.NUMBER },
                    },
                    required: ['paramId', 'property', 'minVal', 'maxVal'],
                  },
                },
                required: ['id', 'name', 'type', 'position', 'color', 'explanation', 'funFact'],
              },
            },
            parameters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  min: { type: Type.NUMBER },
                  max: { type: Type.NUMBER },
                  step: { type: Type.NUMBER },
                  defaultValue: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                },
                required: ['id', 'name', 'min', 'max', 'step', 'defaultValue', 'description'],
              },
            },
            stepGuide: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  instruction: { type: Type.STRING },
                  highlightElementId: { type: Type.STRING },
                },
                required: ['title', 'instruction'],
              },
            },
            missions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.NUMBER },
                  explanation: { type: Type.STRING },
                  rewardBadge: { type: Type.STRING },
                },
                required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'rewardBadge'],
              },
            },
            teacherGuide: {
              type: Type.OBJECT,
              properties: {
                learningObjectives: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                suggestedQuestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                classroomActivity: { type: Type.STRING },
              },
              required: ['learningObjectives', 'suggestedQuestions', 'classroomActivity'],
            },
          },
          required: [
            'id',
            'title',
            'gradeLevel',
            'category',
            'categoryLabel',
            'description',
            'color',
            'camera',
            'environment',
            'elements',
            'parameters',
            'missions',
            'teacherGuide',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Respuesta vacía del modelo');
    }

    const simulation = JSON.parse(text);
    return res.json({ success: true, simulation });
  } catch (error: any) {
    console.warn('Gemini API notice (depleted quota/credits or transient error), activating pedagogical generator:', error?.message);
    const simulation = generateSmartSimulation(topic, gradeLevel, category);
    return res.json({
      success: true,
      fallback: true,
      warning: 'Simulación generada mediante motor didáctico interactivo de contingencia.',
      simulation,
    });
  }
});

// Production or Vite Dev middleware setup
const startServer = async () => {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`🚀 SimulaCiencia 3D server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
