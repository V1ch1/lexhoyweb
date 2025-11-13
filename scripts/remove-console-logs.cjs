// scripts/remove-console-logs.js
const fs = require('fs');
const path = require('path');

// Función para procesar archivos recursivamente
function processDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Saltar node_modules, .next, .git, etc.
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        processDirectory(fullPath, extensions);
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      removeConsoleLogs(fullPath);
    }
  });
}

// Función para remover console.log de un archivo
function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Patrones para remover console.log
    const patterns = [
      // console.log(...) 
      /console\.log\([^;]*\);?\s*\n?/g,
      // console.log(...)
      /\s*console\.log\([^)]*\)[^;]*;?/g,
      // Múltiples líneas de console.log
      /\s*console\.log\(\s*[\s\S]*?\)\s*;?\s*\n?/g,
    ];
    
    patterns.forEach(pattern => {
      content = content.replace(pattern, '');
    });
    
    // Limpiar líneas vacías excesivas
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Solo escribir si hay cambios
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Limpiado: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

// Ejecutar el script
console.log('🧹 Eliminando console.log de archivos TypeScript/JavaScript...');

const projectRoot = path.join(__dirname, '..');
const dirsToProcess = [
  path.join(projectRoot, 'app'),
  path.join(projectRoot, 'components'),
  path.join(projectRoot, 'lib'),
];

dirsToProcess.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`📁 Procesando directorio: ${dir}`);
    processDirectory(dir);
  }
});

console.log('✅ Limpieza de console.log completada');