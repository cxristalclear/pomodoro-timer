const fs = require('fs');
const path = require('path');

const DEFAULT_DIR = path.join(__dirname); // Change this if your code is in a specific folder
const exts = ['.js', '.jsx', '.ts', '.tsx'];

const targetDir = process.argv[2] ? path.join(__dirname, process.argv[2]) : DEFAULT_DIR;

if (!fs.existsSync(targetDir)) {
  console.error(`Directory "${targetDir}" does not exist. Please specify a valid directory.`);
  process.exit(1);
}

function getAllFiles(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (exts.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  });
  return files;
}

function fileIsImported(filePath, allFiles) {
  const fileName = path.basename(filePath, path.extname(filePath));
  for (const otherFile of allFiles) {
    if (otherFile === filePath) continue;
    const content = fs.readFileSync(otherFile, 'utf8');
    // Check for import or require statements
    const importRegex = new RegExp(`(import|require)\\s.*['"\`]([^'"\`]*${fileName})['"\`]`);
    if (importRegex.test(content)) {
      return true;
    }
  }
  return false;
}

const allFiles = getAllFiles(targetDir);
const unusedFiles = allFiles.filter(file => !fileIsImported(file, allFiles));

console.log('Unused files:');
unusedFiles.forEach(f => console.log(path.relative(__dirname, f)));