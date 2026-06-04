const fs = require('fs');
const path = require('path');

function checkDir(dir) {
  if (dir.includes('node_modules')) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      checkDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('<Ionicons') && !content.includes("import { Ionicons } from '@expo/vector-icons'")) {
        console.log(fullPath);
      }
    }
  });
}

checkDir('.');
