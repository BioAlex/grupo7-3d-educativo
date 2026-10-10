import JSZip from 'jszip';

/**
 * Bundles the full SimulaCiencia 3D project into a downloadable .ZIP archive.
 * Includes all source files, presets, documentation, and 1-click startup scripts for Windows and Linux.
 */
export async function downloadOfflineProjectZip(onProgress?: (status: string) => void): Promise<void> {
  if (onProgress) onProgress('Preparando archivos del repositorio...');

  const zip = new JSZip();

  // Root files to fetch and include in the zip archive
  const filePaths = [
    'README.md',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'metadata.json',
    'iniciar_escuela.bat',
    'iniciar_escuela.sh',
    'server.ts',
    'src/main.tsx',
    'src/App.tsx',
    'src/index.css',
    'src/types/simulation.ts',
    'src/data/presetSimulations.ts',
    'src/utils/audio.ts',
    'src/utils/offlinePackager.ts',
    'src/components/ThreeSimulationCanvas.tsx',
    'src/components/SimulationControls.tsx',
    'src/components/InspectorModal.tsx',
    'src/components/MissionsPanel.tsx',
    'src/components/TeacherGuideModal.tsx',
    'src/components/Header.tsx',
    'src/components/OfflineDownloadModal.tsx',
  ];

  let completed = 0;
  for (const path of filePaths) {
    try {
      if (onProgress) onProgress(`Empaquetando: ${path} (${completed + 1}/${filePaths.length})`);
      // In Vite dev or preview, source files can be fetched directly
      const res = await fetch(`/${path}`);
      if (res.ok) {
        const text = await res.text();
        zip.file(path, text);
      }
    } catch {
      // Continue bundling
    }
    completed++;
  }

  if (onProgress) onProgress('Comprimiendo archivo ZIP para descarga...');

  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) onProgress(`Comprimiendo: ${Math.round(metadata.percent)}%`);
  });

  // Trigger browser file download
  const blobUrl = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = 'SimulaCiencia3D_Repositorio_Offline.zip';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(blobUrl);

  if (onProgress) onProgress('¡Descarga completada!');
}
