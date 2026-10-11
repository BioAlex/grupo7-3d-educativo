# SimulaCiencia 3D - Laboratorio Científico Escolar Offline

Herramienta interactiva de simulaciones científicas 3D para colegios de nivel primario (1º a 6º de primaria). Diseñada para funcionar **100% desconectada de Internet (entornos offline / redes locales / intranet escolar)**.

---

## 🚀 Requisitos para Ejecución Offline

- **Node.js** v18 o superior (o v20 / v22 LTS) instalado en la máquina o servidor local.
- **Navegador web moderno** (Google Chrome, Mozilla Firefox, Microsoft Edge, Chromium).
- **No se requiere conexión a Internet** una vez instalado el proyecto o compilada la carpeta `dist`.
- **Cero dependencias de APIs externas o CDNs**: Todas las librerías 3D (Three.js), gráficos, animaciones, sonidos sintetizados y los 8 modelos de ciencias están empaquetados localmente.

---

## 📦 Puesta en Marcha en una Computadora o Servidor Local (LAN)

### 1. Instalación de dependencias (se realiza una única vez con acceso o mediante caché):
```bash
npm install
```

### 2. Ejecutar en Modo Desarrollo Local:
```bash
npm run dev
```
La aplicación se abrirá en `http://localhost:3000` (o `http://0.0.0.0:3000`).

---

## 🌐 Compartir en la Red Local del Colegio (Wi-Fi o Cable Ethernet sin Internet)

Para que todos los estudiantes con tablets, computadoras o pizarras interactivas del aula accedan a la aplicación conectándose a la misma red local:

### Opción A: Compilar versión estática de producción (Recomendada y ultrarrápida)
```bash
# 1. Compilar la aplicación a archivos estáticos
npm run build

# 2. Servir los archivos compilados en la red local
npx vite preview --host 0.0.0.0 --port 3000
```

### Opción B: Con Python (si la máquina ya tiene Python instalado)
```bash
npm run build
cd dist
python3 -m http.server 3000 --bind 0.0.0.0
```

### Opción C: Con servidor Node.js
```bash
npm start
```

### 📲 Cómo acceden los alumnos y profesores desde sus dispositivos:
1. En la computadora que actúa como servidor local, averigua su dirección IP local:
   - En Windows: abre CMD y escribe `ipconfig` (ej: `192.168.1.50`).
   - En Linux/Mac: abre terminal y escribe `hostname -I` o `ifconfig`.
2. En las tablets o computadoras de los alumnos, abre el navegador e ingresa:
   ```
   http://192.168.1.50:3000
   ```
¡Listo! Todos los alumnos podrán interactuar con las 8 simulaciones 3D simultáneamente a máxima velocidad y con 0% de uso de internet.

---

## 🧪 Catálogo de Simulaciones 3D Curriculares Incluidas

1. 💧 **El Ciclo del Agua y los Estados de la Materia** (*3º-4º Primaria*)
   - Evaporación del mar, condensación en nubes y lluvia con control de temperatura de -10°C a 100°C.
2. 🪐 **El Sistema Solar y la Danza de los Planetas** (*3º-4º Primaria*)
   - El Sol, Mercurio, Venus, Tierra con la Luna, Marte y Saturno con anillos en órbitas 3D.
3. 🌱 **La Fotosíntesis y la Fábrica de las Plantas** (*3º-4º Primaria*)
   - Raíces absorbiendo H2O, estomas absorbiendo CO2, luz solar y liberación de O2.
4. 🌋 **El Volcán y las Capas Ocultas de la Tierra** (*4º-6º Primaria*)
   - Corte transversal 3D de Corteza, Manto y Núcleo con control de presión magmática y erupción.
5. 🧲 **El Misterio de los Imanes y el Campo Magnético** (*2º-4º Primaria*)
   - Polos Norte y Sur con líneas de campo magnético visibles y fuerzas de atracción/repulsión.
6. ⚙️ **Máquinas Simples: La Palanca y el Balancín** (*2º-5º Primaria*)
   - Punto de apoyo (fulcro), resistencia y esfuerzo para experimentar la ventaja mecánica.
7. 🌈 **El Arcoíris y la Refracción de la Luz** (*1º-2º Primaria*)
   - Luz blanca solar que se dobla y se divide en 7 colores dentro de las gotas de lluvia.
8. ⛵ **¿Por qué Flotan los Barcos? Flotabilidad y Densidad** (*3º-4º Primaria*)
   - El principio de Arquímedes, empuje ascendente del agua, peso y volumen hueco del casco.

---

## 🛠️ Herramientas Docentes Incluidas
- **Guía Didáctica Docente Imprimible**: Objetivos pedagógicos, preguntas reflexivas para el aula y experimentos caseros.
- **Misiones Científicas con Medallas**: Retos interactivos con retroalimentación y lluvia de confeti.
- **Efectos de Sonido y Lectura en Voz Alta**: Síntesis de audio nativa sin archivos externos.
- **Modo Pizarra Digital**: Visualización a pantalla completa para proyectores y SmartBoards.
- **Captura de Pantalla**: Botón para guardar imágenes de los experimentos para tareas de los alumnos.

---

## 📊 ANEXO: Análisis de Capacidad y Cálculo de Cuellos de Botella en Red Local

Este anexo técnico detalla el cálculo de concurrencia y dimensionamiento de red cuando se levanta el aplicativo en `localhost` para uso simultáneo de estudiantes en un aula o colegio sin conexión a Internet.

### 1. Principio Clave de Arquitectura: Single Page Application (SPA)
- **Ejecución 100% en el dispositivo del alumno**: La computadora host actúa **únicamente como despachador de archivos estáticos al inicio** (HTML, CSS, librerías y bundles de Three.js).
- **Cero tráfico continuo al servidor**: Una vez que la página carga en el navegador del estudiante, todo el renderizado 3D, cálculos físicos de los sliders, síntesis de audio, narración y desafíos interactivos corren en la CPU y GPU del propio dispositivo del alumno.
- **Tráfico durante la simulación activa**: **0 KB/s**. No hay llamadas periódicas a APIs ni transferencias de base de datos mientras los alumnos experimentan.

---

### 2. Dimensionamiento de Tráfico y Datos por Dispositivo

| Métrica | Valor Real |
| :--- | :--- |
| **Peso total de la descarga inicial** | **~310 KB** (comprimido gzip) / ~1.1 MB sin comprimir |
| **Peticiones HTTP por dispositivo** | 1 descarga al inicio (luego se mantiene en la memoria caché del navegador) |
| **Consumo de red durante el uso** | **0 KB/s** |
| **Carga en CPU/RAM del servidor** | Menos del 2% en una PC de oficina estándar |

---

### 3. Identificación y Cálculo de los Cuellos de Botella

#### 🔴 Cuello de Botella #1: El Punto de Acceso Wi-Fi del Aula (Límite Principal)
En la práctica escolar, el servidor casi nunca es el factor limitante; el verdadero cuello de botella es el router o Access Point Wi-Fi:
- **Routers domésticos básicos (o del proveedor ISP)**:
  - Tienen chips de radio pensados para hogares y suelen saturar sus tablas DHCP/ARP con **25 a 35 dispositivos simultáneos**, experimentando desconexiones por contención en la frecuencia de 2.4 GHz.
- **Access Points profesionales o educativos (Wi-Fi 5 / Wi-Fi 6, ej. Ubiquiti UniFi, Aruba, TP-Link Omada)**:
  - Gestionan sin problemas de **100 a 250 conexiones simultáneas** en bandas de 5 GHz.

#### 🟡 Cuello de Botella #2: El "Efecto Avalancha" en el Segundo Cero
Ocurre cuando todo el salón abre la URL en el mismo segundo:
- Para **40 alumnos**: `40 × 310 KB = ~12.4 MB` en total.
  - En una red Wi-Fi básica de 50 Mbps reales, esos 12.4 MB se transfieren en **~2 segundos**.
  - Si la PC servidora está conectada por cable Ethernet Gigabit al router, la entrega inicial toma **menos de 0.1 segundos**.

#### 🟢 Rendimiento del Servidor Local (Host)
- Una computadora común (Intel Core i3/i5, 8 GB de RAM o Raspberry Pi 4):
  - Con un servidor estático (`npm run build` y `npx vite preview` o Nginx), puede despachar **entre 2.000 y 5.000 peticiones por segundo**.
  - Capacidad teórica del servidor: **Más de 500 a 1.000 estudiantes simultáneos** en red local cableada.

---

### 4. Matriz de Capacidad por Escenarios de Aula

| Escenario | Cantidad de Dispositivos | Rendimiento Esperado | Recomendación de Red |
| :--- | :--- | :--- | :--- |
| **1 Aula estándar** | **25 – 40 alumnos** | **Excelente (Fluidez total)** | Router Wi-Fi estándar en el aula. |
| **2 a 3 Aulas juntas** | **60 – 120 alumnos** | **Muy bueno** | Conectar el servidor por **cable Ethernet** al switch/router y utilizar Wi-Fi en **5 GHz**. |
| **Colegio completo** | **200 – 500 alumnos** | El servidor lo soporta fácilmente; el límite residirá en los Access Points distribuidos en los pabellones. | Compilar versión estática con `npm run build` y distribuir la señal mediante 2 o más Access Points. |

---

### 5. Recomendación para Máximo Desempeño Escolar
Para garantizar respuesta instantánea y mínimo consumo de energía en la máquina servidora:
1. Compilar para producción una única vez:
   ```bash
   npm run build
   ```
2. Servir la versión optimizada en la red local:
   ```bash
   npx vite preview --host 0.0.0.0 --port 3000
   ```
*(O ejecutar el script automatizado `iniciar_escuela.bat` en Windows o `iniciar_escuela.sh` en Linux).*

---

## 🎨 Arquitectura 3D del Aplicativo: Cómo se Generan las Vistas y Bibliotecas Utilizadas

Este capítulo explica en detalle y con lenguaje didáctico cómo se construyen, animan y renderizan las vistas tridimensionales de las simulaciones científicas en la aplicación.

---

### 1. ¿Qué bibliotecas y tecnologías se utilizan?

El motor gráfico 3D de **SimulaCiencia** se basa en tecnologías abiertas y estándares de la web moderna:

| Tecnología / Biblioteca | Rol en el Aplicativo | ¿Por qué se utiliza? |
| :--- | :--- | :--- |
| **WebGL (Web Graphics Library)** | Capa nativa del navegador | API nativa de JavaScript que permite comunicarse directamente con la tarjeta gráfica (GPU) del computador, tablet o celular sin instalar plugins. |
| **Three.js** (`three`) | Biblioteca central de gráficos 3D | Envoltorio de alto nivel sobre WebGL. Convierte operaciones matemáticas complejas (matrices, shaders, vectores) en conceptos intuitivos como *Escena*, *Cámara*, *Mallas*, *Luces* y *Materiales*. |
| **Lucide React** (`lucide-react`) | Iconografía vectorial SVG | Iconos nítidos de interfaz de usuario para controles de cámara (rotar, zoom, reiniciar vista), etiquetas de ciencia y paneles de telemetría. |
| **Canvas API + HTML5** | Contenedor gráfico de alta velocidad | Proporciona el elemento `<canvas>` donde Three.js dibuja a 60 cuadros por segundo (FPS). |

---

### 2. El Pipeline 3D: Los 5 Pilares Fundamentales de Three.js

Para entender cómo se genera cualquier vista 3D en la aplicación, se utiliza la metáfora de un **estudio de cine o teatro**:

```
      [ 1. La Escena (Scene) ]  <--- Contenedor del escenario
              │
      ┌───────┴───────────────┐
      ▼                       ▼
 [ 2. Los Objetos ]      [ 3. Las Luces ]
 (Geometría + Material)    (Sol, Ambiente)
      │                       │
      └───────┬───────────────┘
              │
              ▼
    [ 4. La Cámara (Camera) ]   <--- Perspectiva y ángulo de visión
              │
              ▼
    [ 5. El Renderizador (Renderer) ] -> Dibuja en pantalla (<canvas>)
```

1. **La Escena (`THREE.Scene`)**:
   - Es el universo tridimensional vacío donde colocamos todos los elementos (planetas, imanes, gotas de agua, barco).
2. **La Cámara (`THREE.PerspectiveCamera`)**:
   - Es el ojo del observador. En la aplicación usamos una cámara en perspectiva con campo de visión de $45^\circ$ a $50^\circ$, que simula la visión humana (las cosas lejanas se ven más pequeñas).
3. **Las Mallas / Objetos (`THREE.Mesh`)**:
   - Un objeto 3D visible nace de la combinación de dos cosas:
     - **Geometría (`Geometry`)**: La forma matemática de alambre (ej. esfera, cubo, cilindro, cono, toroide).
     - **Material (`Material`)**: Cómo luce su superficie (color, brillo, transparencia, reflejos, emisión de luz propia).
4. **La Iluminación (`THREE.Light`)**:
   - Sin luz, todo se vería negro. La app combina:
     - `THREE.AmbientLight`: Ilumina suavemente todo el escenario para evitar sombras totalmente negras.
     - `THREE.DirectionalLight`: Luz con dirección (como los rayos paralelos del Sol) que proyecta relieve y sombras suaves.
5. **El Renderizador (`THREE.WebGLRenderer`)**:
   - Toma la escena desde el punto de vista de la cámara y genera la imagen final píxel por píxel en el elemento `<canvas>`.

---

### 3. Explicación Simple: Cómo usar Three.js en 4 Pasos

Si deseas crear tu propio experimento 3D básico en JavaScript o TypeScript, estos son los pasos mínimos:

#### Paso 1: Crear la Escena, Cámara y Renderizador
```typescript
import * as THREE from 'three';

// 1. Crear el escenario
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0f172a'); // Fondo azul espacial

// 2. Crear la cámara (Campo de visión, relación de aspecto, plano cercano, plano lejano)
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 12); // Elevar la cámara y alejarla en Z
camera.lookAt(0, 0, 0);       // Apuntar al centro del mundo

// 3. Crear el motor de renderizado y asociarlo a la pantalla
const renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias suaviza los bordes
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
```

#### Paso 2: Agregar Iluminación
```typescript
// Luz ambiental general
const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(luzAmbiente);

// Luz del sol dirigida
const luzSol = new THREE.DirectionalLight(0xffffff, 1.2);
luzSol.position.set(10, 20, 10);
scene.add(luzSol);
```

#### Paso 3: Crear Geometrías y Materiales (Nuestros Modelos)
En la aplicación, todos los modelos se generan proceduralmente sin archivos pesados externos:

```typescript
// Ejemplo A: Una Tierra (Esfera)
const geoEsfera = new THREE.SphereGeometry(1.5, 32, 32); // Radio 1.5, resolución 32 segmentos
const matTierra = new THREE.MeshStandardMaterial({
  color: 0x3b82f6,      // Azul brillante
  roughness: 0.4,       // Rugosidad media
  metalness: 0.1,
});
const tierra = new THREE.Mesh(geoEsfera, matTierra);
scene.add(tierra);

// Ejemplo B: Un Imán Bipolar (Cajas compuestas)
const grupoIman = new THREE.Group();

const geoPolo = new THREE.BoxGeometry(0.8, 0.6, 1.6);
const matNorte = new THREE.MeshStandardMaterial({ color: 0xef4444 }); // Rojo
const matSur = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });   // Azul

const poloNorte = new THREE.Mesh(geoPolo, matNorte);
poloNorte.position.x = -0.4;

const poloSur = new THREE.Mesh(geoPolo, matSur);
poloSur.position.x = 0.4;

grupoIman.add(poloNorte);
grupoIman.add(poloSur);
scene.add(grupoIman);
```

#### Paso 4: El Bucle de Animación (`requestAnimationFrame`)
Para que las figuras se muevan, giren u ondeen de acuerdo a las leyes físicas:

```typescript
function animar() {
  requestAnimationFrame(animar);

  // 1. Modificar posiciones o rotaciones
  tierra.rotation.y += 0.01; // Rotación sobre su propio eje

  // 2. Volver a dibujar la escena
  renderer.render(scene, camera);
}

// Iniciar el ciclo
animar();
```

---

### 4. Técnicas Especiales Utilizadas en SimulaCiencia

Nuestra implementación en `src/components/ThreeSimulationCanvas.tsx` incluye técnicas avanzadas adaptadas a la educación primaria:

1. **Sistemas de Partículas en GPU (`THREE.Points`)**:
   - Usado para la lluvia (`ciclo-agua`), las burbujas de oxígeno (`fotosintesis`), la lava incandescente (`volcan-tierra`) y el polvo estelar (`sistema-solar`).
   - Cada gota o burbuja almacena su posición $(x, y, z)$ en un búfer (`Float32Array`). En cada fotograma, sus velocidades se recalculan según los controles deslizantes (ej. más lluvia = mayor velocidad y densidad).

2. **Control Orbital Táctil y con Ratón (Orbit Controls Personalizado)**:
   - Permite a los niños arrastrar con el dedo en tablets o con el ratón en la computadora para rotar $360^\circ$ alrededor del experimento.
   - Utiliza coordenadas esféricas $(\text{radio}, \theta, \phi)$ convertidas a cartesianas $(x, y, z)$ sin librerías pesadas externas.

3. **Modulación de Física en Tiempo Real por Parámetros**:
   - Cuando el usuario mueve un control deslizante (ej. *Densidad del Barco*, *Salinidad del Agua*, *Posición del Fulcro* o *Temperatura*), las mallas 3D actualizan instantáneamente su flotabilidad, balanceo de olas, emisión de luz o ángulo de palanca mediante fórmulas físicas directas.

4. **HUD de Telemetría Gráfica en Vivo**:
   - Superposición semitransparente que extrae los cálculos de la simulación en tiempo real y muestra diagramas interactivos (vector de empuje hidrostático, torques y ventaja mecánica, espectro cromático a $42^\circ$, etc.).

