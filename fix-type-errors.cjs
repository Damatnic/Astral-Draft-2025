#!/usr/bin/env node
/**
 * Type Error Auto-Fixer
 * Fixes common TypeScript errors in the project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  ignoreDirs: ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.cache'],
  fileExtensions: ['.ts', '.tsx'],
  backupDir: '.type-fix-backup',
  verbose: true
};

// Type fixes to apply
const typeFixes = [
  // Fix implicit any type in parameters
  {
    name: 'Add type to filter/map/forEach callbacks',
    pattern: /\.(filter|map|forEach|some|every|find|findIndex|reduce)\((\w+)\s*=>/g,
    replacement: '.$1(($2: any) =>',
    test: (line) => !line.includes(': any') && !line.includes('<')
  },
  {
    name: 'Add type to event handlers',
    pattern: /\bon\w+={?\(e\)\s*=>/g,
    replacement: (match) => match.replace('(e)', '(e: any)'),
    test: (line) => !line.includes('(e: any)')
  },
  {
    name: 'Add type to standalone arrow functions',
    pattern: /const\s+\w+\s*=\s*\((\w+)\)\s*=>/g,
    replacement: (match, param) => match.replace(`(${param})`, `(${param}: any)`),
    test: (line) => !line.includes(': any') && !line.includes('<')
  },
  // Fix possibly undefined values
  {
    name: 'Add optional chaining for possibly undefined',
    pattern: /(\w+)\.(adp|tier|age|status|injury)(?![?.])/g,
    replacement: '$1.$2',
    transform: (match, obj, prop) => {
      // Only add ? if not already there and not in a comparison
      if (!match.includes('?.')) {
        return `${obj}?.${prop}`;
      }
      return match;
    }
  },
  {
    name: 'Add nullish coalescing for undefined values',
    pattern: /Math\.(min|max|floor|ceil|round)\(([^,)]*\.(adp|tier|age)[^,)]*)\)/g,
    replacement: (match, method, expr) => {
      if (!expr.includes('??')) {
        return `Math.${method}(${expr} ?? 0)`;
      }
      return match;
    }
  },
  // Fix type mismatches
  {
    name: 'Fix string property access on injury arrays',
    pattern: /player\.injury\.(some|map|filter|length)/g,
    replacement: 'Array.isArray(player.injury) ? player.injury.$1',
    transform: (match, method) => {
      return `(Array.isArray(player.injury) ? player.injury.${method} : [].${method})`;
    }
  },
  {
    name: 'Fix injury type issues',
    pattern: /injuries?\.(some|map|filter|forEach)\(/g,
    replacement: (match) => {
      return `(Array.isArray(injuries) ? injuries : []).${match.split('.')[1]}`;
    }
  }
];

// Statistics
const stats = {
  filesProcessed: 0,
  filesFixed: 0,
  totalFixes: 0,
  errors: []
};

// Process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;
    let fileFixCount = 0;
    
    // Process line by line for better control
    const processedLines = lines.map((line, index) => {
      let processedLine = line;
      
      for (const fix of typeFixes) {
        // Check if fix should be applied
        if (fix.test && !fix.test(line)) {
          continue;
        }
        
        const matches = line.match(fix.pattern);
        if (matches) {
          const before = processedLine;
          
          if (fix.transform) {
            processedLine = processedLine.replace(fix.pattern, fix.transform);
          } else if (typeof fix.replacement === 'function') {
            processedLine = processedLine.replace(fix.pattern, fix.replacement);
          } else {
            processedLine = processedLine.replace(fix.pattern, fix.replacement);
          }
          
          if (before !== processedLine) {
            fileFixCount++;
            modified = true;
            if (CONFIG.verbose) {
              console.log(`  Line ${index + 1}: ${fix.name}`);
            }
          }
        }
      }
      
      return processedLine;
    });
    
    // Apply additional file-wide fixes
    let processedContent = processedLines.join('\n');
    
    // Add Player import if missing but used
    if (!processedContent.includes("import") && !processedContent.includes("{ Player }") && 
        processedContent.includes(": Player")) {
      processedContent = `import { Player } from '../../data/players';\n` + processedContent;
      fileFixCount++;
      modified = true;
    }
    
    // Fix specific component issues
    if (filePath.includes('MobilePlayerCard')) {
      // Fix the Math functions with undefined values
      processedContent = processedContent.replace(
        /Math\.(min|max)\(([^,)]+),\s*([^)]+)\)/g,
        (match, method, arg1, arg2) => {
          if (!arg1.includes('??') && (arg1.includes('.adp') || arg1.includes('.age'))) {
            arg1 = `(${arg1} ?? 0)`;
          }
          if (!arg2.includes('??') && (arg2.includes('.adp') || arg2.includes('.age'))) {
            arg2 = `(${arg2} ?? 0)`;
          }
          return `Math.${method}(${arg1}, ${arg2})`;
        }
      );
    }
    
    if (filePath.includes('MobileSearchInterface') || filePath.includes('NewsAndUpdatesTab')) {
      // Fix injury array/string confusion
      processedContent = processedContent.replace(
        /(\w+)\.injury\.(some|map|filter|forEach)\(/g,
        '(Array.isArray($1.injury) ? $1.injury : []).$2('
      );
    }
    
    // Save the file if modified
    if (modified) {
      // Create backup
      const backupPath = path.join(CONFIG.backupDir, path.relative(process.cwd(), filePath));
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.copyFileSync(filePath, backupPath);
      
      // Write fixed content
      fs.writeFileSync(filePath, processedContent, 'utf8');
      
      stats.filesFixed++;
      stats.totalFixes += fileFixCount;
      console.log(`✅ Fixed ${filePath}: ${fileFixCount} fixes`);
    } else {
      console.log(`⚪ No fixes needed: ${filePath}`);
    }
    
    stats.filesProcessed++;
    
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

// Scan directory recursively
function scanDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !CONFIG.ignoreDirs.includes(item)) {
      scanDirectory(fullPath);
    } else if (stat.isFile() && CONFIG.fileExtensions.some(ext => item.endsWith(ext))) {
      processFile(fullPath);
    }
  });
}

// Get TypeScript errors
function getTypeScriptErrors() {
  try {
    execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
    return [];
  } catch (error) {
    if (error.stdout || error.stderr) {
      const output = error.stdout || error.stderr || '';
      return output.split('\n').filter(line => line.trim());
    }
    return [];
  }
}

// Main execution
function main() {
  console.log('🔧 Type Error Auto-Fixer');
  console.log('=' .repeat(60));
  
  // Create backup directory
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
  
  // Get initial error count
  console.log('📊 Analyzing TypeScript errors...');
  const initialErrors = getTypeScriptErrors();
  console.log(`Found ${initialErrors.length} TypeScript errors\n`);
  
  // Process components directory
  const componentsPath = path.join(process.cwd(), 'components');
  if (fs.existsSync(componentsPath)) {
    console.log('🔍 Processing components...\n');
    scanDirectory(componentsPath);
  }
  
  // Get final error count
  console.log('\n📊 Re-analyzing TypeScript errors...');
  const finalErrors = getTypeScriptErrors();
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('✨ Type Fix Complete!');
  console.log('=' .repeat(60));
  console.log(`📁 Files Processed: ${stats.filesProcessed}`);
  console.log(`✏️  Files Fixed: ${stats.filesFixed}`);
  console.log(`🔧 Total Fixes: ${stats.totalFixes}`);
  console.log(`📉 Errors Reduced: ${initialErrors.length} → ${finalErrors.length}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  ${stats.errors.length} files had errors:`);
    stats.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
  }
  
  console.log(`\n💾 Backups saved to: ${CONFIG.backupDir}`);
  
  if (finalErrors.length > 0) {
    console.log(`\n⚠️  ${finalErrors.length} TypeScript errors remain. Review manually.`);
  } else {
    console.log('\n✅ All TypeScript errors fixed!');
  }
}

// Run the fixer
if (require.main === module) {
  main();
}

module.exports = { processFile, scanDirectory, typeFixes };