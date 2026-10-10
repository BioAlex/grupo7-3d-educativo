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
