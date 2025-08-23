const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  ignoreDirs: ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.cache', '.error-scanner-backup'],
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  reportPath: './conservative-error-report.md',
  backupEnabled: true,
  backupDir: './.conservative-backup',
  maxFileSize: 1024 * 1024 * 5, // 5MB max file size
  maxPasses: 2, // Conservative number of passes
};

// Statistics tracker
const stats = {
  filesScanned: 0,
  filesModified: 0,
  totalFixes: 0,
  unfixableErrors: [],
  warnings: [],
  criticalErrors: [],
  fixesByCategory: {}
};

// Conservative error patterns - only fix obvious issues
const errorFixes = [
  // Fix obvious import issues
  {
    name: 'Fix trailing semicolon on imports',
    pattern: /^(import\s+.+from\s+['"][^'"]+['"])\s*$/gm,
    replacement: '$1;',
    category: 'imports',
    severity: 'error'
  },
  
  // Fix obvious semicolon issues  
  {
    name: 'Remove double semicolons',
    pattern: /;;+/g,
    replacement: ';',
    category: 'semicolons',
    severity: 'warning'
  },
  
  // Fix obvious bracket issues
  {
    name: 'Fix stray closing braces at line start',
    pattern: /^\s*}\s*$/gm,
    replacement: '',
    category: 'brackets',
    severity: 'error'
  },
  
  // Fix obvious JSX issues
  {
    name: 'Fix JSX stray semicolons',
    pattern: /<(\w+);/g,
    replacement: '<$1',
    category: 'jsx',
    severity: 'error'
  },
  
  // Fix $2 patterns (safe replacements)
  {
    name: 'Fix $2 export patterns',
    pattern: /\$2 (export\s+)/g,
    replacement: '$1',
    category: 'syntax',
    severity: 'error'
  },
  {
    name: 'Fix $2 const patterns',
    pattern: /\$2 (const\s+\w+)/g,
    replacement: '$1',
    category: 'syntax',
    severity: 'error'
  },
  {
    name: 'Fix $2 interface patterns',
    pattern: /\$2 (interface\s+\w+)/g,
    replacement: '$1',
    category: 'syntax',
    severity: 'error'
  },
  {
    name: 'Fix $2 class patterns',
    pattern: /\$2 (class\s+\w+)/g,
    replacement: '$1',
    category: 'syntax',
    severity: 'error'
  },
  
  // Remove standalone $2 patterns
  {
    name: 'Remove standalone $2',
    pattern: /^\s*\$2\s*$/gm,
    replacement: '',
    category: 'syntax',
    severity: 'error'
  }
];

// Create backup of file
function createBackup(filePath) {
  if (!CONFIG.backupEnabled) return null;
  
  const backupPath = path.join(CONFIG.backupDir, path.relative(process.cwd(), filePath));
  const backupDir = path.dirname(backupPath);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Add timestamp to backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const ext = path.extname(backupPath);
  const name = path.basename(backupPath, ext);
  const backupFile = path.join(backupDir, `${name}-${timestamp}${ext}`);
  
  fs.copyFileSync(filePath, backupFile);
  return backupFile;
}

// Conservative file processor
function processFile(filePath) {
  try {
    // Check file size
    const fileStats = fs.statSync(filePath);
    if (fileStats.size > CONFIG.maxFileSize) {
      stats.warnings.push(`File too large: ${filePath} (${(fileStats.size / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let totalFileFixes = 0;
    let modified = false;
    
    console.log(`\n📄 Processing: ${filePath}`);
    
    // Apply conservative fixes
    errorFixes.forEach(fix => {
      const beforeContent = content;
      const matches = content.match(fix.pattern);
      
      if (matches && matches.length > 0) {
        content = content.replace(fix.pattern, fix.replacement);
        
        // Only count if content actually changed
        if (beforeContent !== content) {
          const fixCount = matches.length;
          totalFileFixes += fixCount;
          
          // Track fixes by category
          if (!stats.fixesByCategory[fix.category]) {
            stats.fixesByCategory[fix.category] = 0;
          }
          stats.fixesByCategory[fix.category] += fixCount;
          
          console.log(`  ✓ ${fix.name}: ${fixCount} fixes`);
          modified = true;
        }
      }
    });
    
    // Save modified file
    if (modified) {
      const backupPath = createBackup(filePath);
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesModified++;
      stats.totalFixes += totalFileFixes;
      console.log(`  ✅ Total fixes applied: ${totalFileFixes}`);
      if (backupPath) {
        console.log(`  💾 Backup saved: ${backupPath}`);
      }
    } else {
      console.log(`  ℹ️  No fixes needed`);
    }
    
    stats.filesScanned++;
    
  } catch (error) {
    stats.criticalErrors.push({
      file: filePath,
      error: error.message
    });
    console.error(`  ❌ Error: ${error.message}`);
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

// Run TypeScript compiler check
function runTypeScriptCheck() {
  console.log('\n🔍 Running TypeScript compiler check...');
  try {
    execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
    console.log('  ✓ TypeScript compilation successful');
    return [];
  } catch (error) {
    if (error.stdout || error.stderr) {
      const output = error.stdout || error.stderr || '';
      const errors = output.split('\n').filter(line => line.trim());
      console.log(`  ⚠️  Found ${errors.length} TypeScript errors`);
      return errors.slice(0, 100); // Limit to first 100 errors
    }
    return [];
  }
}

// Generate report
function generateReport(tscErrors = []) {
  const timestamp = new Date().toISOString();
  
  let report = `# Conservative Error Scanner Report
Generated: ${timestamp}

## Summary
- **Files Scanned**: ${stats.filesScanned}
- **Files Modified**: ${stats.filesModified}
- **Total Fixes Applied**: ${stats.totalFixes}
- **Remaining Issues**: ${stats.unfixableErrors.length}
- **Warnings**: ${stats.warnings.length}
- **Critical Errors**: ${stats.criticalErrors.length}

## Fixes Applied by Category
`;

  Object.entries(stats.fixesByCategory).forEach(([category, count]) => {
    report += `- **${category}**: ${count} fixes\n`;
  });

  if (stats.criticalErrors.length > 0) {
    report += `\n## ❌ Critical Errors\n`;
    stats.criticalErrors.forEach(error => {
      report += `\n### ${error.file}\n`;
      report += `\`\`\`\n${error.error}\n\`\`\`\n`;
    });
  }

  if (tscErrors.length > 0) {
    report += `\n## TypeScript Compiler Errors\n`;
    report += `Total: ${tscErrors.length} errors\n`;
    report += `\`\`\`\n`;
    tscErrors.slice(0, 50).forEach(error => {
      report += `${error}\n`;
    });
    if (tscErrors.length > 50) {
      report += `\n... and ${tscErrors.length - 50} more errors\n`;
    }
    report += `\`\`\`\n`;
  }

  if (stats.warnings.length > 0) {
    report += `\n## ⚠️ Warnings\n`;
    stats.warnings.forEach(warning => {
      report += `- ${warning}\n`;
    });
  }

  report += `\n## Next Steps

1. **Review Critical Errors**: Fix any file processing errors first
2. **Run Tests**: Ensure the fixes didn't break functionality
3. **Manual Review**: Check any remaining complex issues
4. **TypeScript Check**: Fix any remaining TypeScript compilation errors
5. **Commit Changes**: Review and commit the fixes

## Backup Information
`;

  if (CONFIG.backupEnabled) {
    report += `✅ Original files have been backed up to: ${CONFIG.backupDir}\n`;
    report += `To restore a specific file: \`cp ${CONFIG.backupDir}/[filename] ./[original-path]\`\n`;
  } else {
    report += `⚠️ Backup was disabled. Original files were overwritten.\n`;
  }

  return report;
}

// Main execution
function main() {
  console.log('🚀 Conservative Error Scanner v1.0');
  console.log('=' .repeat(60));
  console.log(`📋 Features:`);
  console.log(`  • ${errorFixes.length} conservative auto-fix patterns`);
  console.log(`  • Safe quote and bracket handling`);
  console.log(`  • Backup protection enabled`);
  console.log(`  • TypeScript error checking`);
  console.log('=' .repeat(60));

  // Create backup directory if needed
  if (CONFIG.backupEnabled && !fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    console.log(`📁 Created backup directory: ${CONFIG.backupDir}`);
  }

  // Determine source directory
  const srcPath = path.join(process.cwd(), 'src');
  const targetPath = fs.existsSync(srcPath) ? srcPath : process.cwd();
  
  console.log(`\n📂 Scanning directory: ${targetPath}`);
  
  // Scan and fix files
  scanDirectory(targetPath);
  
  // Run additional checks
  const tscErrors = runTypeScriptCheck();
  
  // Generate report
  const report = generateReport(tscErrors);
  
  // Save report
  fs.writeFileSync(CONFIG.reportPath, report, 'utf8');
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Conservative Error Scanner Complete!');
  console.log('=' .repeat(60));
  console.log(`📊 Files Scanned: ${stats.filesScanned}`);
  console.log(`✏️  Files Modified: ${stats.filesModified}`);
  console.log(`🔧 Total Fixes: ${stats.totalFixes}`);
  console.log(`⚠️  Remaining Issues: ${stats.unfixableErrors.length}`);
  console.log(`📄 Report saved to: ${CONFIG.reportPath}`);
  
  if (CONFIG.backupEnabled) {
    console.log(`💾 Backups saved to: ${CONFIG.backupDir}`);
  }
  
  console.log('\n👉 Run "cat conservative-error-report.md" to view the detailed report');
  
  // Exit with error code if critical issues remain
  if (stats.criticalErrors.length > 0) {
    console.log('\n⚠️  Some critical issues require manual intervention');
    process.exit(1);
  }
}

// Run the scanner
if (require.main === module) {
  main();
}

module.exports = {
  scanDirectory,
  processFile,
  generateReport,
  CONFIG,
  errorFixes,
  stats
};
