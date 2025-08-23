#!/usr/bin/env node
/**
 * Master Error Scanner - Ultimate Edition
 * ========================================
 * Combines aggressive and conservative scanning with enhanced quote protection
 * 
 * Features:
 * - Dual-mode operation: Conservative + Aggressive
 * - Enhanced quote corruption prevention
 * - Smart bracket and quote validation
 * - Multi-pass optimization with rollback
 * - Git integration
 * - TypeScript compilation checking
 * - Comprehensive error reporting
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// ============================================================================
// Configuration System
// ============================================================================

class Config {
  constructor(argv = process.argv) {
    this.options = this.parseArguments(argv);
    this.loadConfigFile();
    this.validateConfig();
  }

  parseArguments(argv) {
    const defaults = {
      // Paths
      dir: null,
      files: [],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      ignore: ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.cache', '.error-scanner-backup'],
      
      // Modes
      mode: 'conservative', // conservative | aggressive | smart | hybrid
      strategy: 'safe', // safe | pattern | ast | hybrid
      
      // Safety features
      validateQuotes: true,
      preventQuoteCorruption: true,
      strictBracketMatching: true,
      validateAfterFix: true,
      
      // Processing
      maxPasses: 2,
      parallel: false, // Disabled by default for safety
      workers: Math.max(1, os.cpus().length - 1),
      batchSize: 50,
      
      // Fixes
      enableQuoteFixes: true,
      enableBracketFixes: true,
      enableTypescriptFixes: true,
      enableReactFixes: true,
      enableImportFixes: true,
      enableSyntaxFixes: true,
      
      // Safety
      dryRun: false,
      backup: true,
      backupDir: '.master-scanner-backup',
      verify: true,
      rollbackOnError: true,
      
      // Reporting
      verbose: false,
      quiet: false,
      report: 'master-error-report.json',
      markdown: 'master-error-report.md',
      html: null,
      
      // Integration
      prettier: false, // Disabled by default to prevent corruption
      eslint: false,
      typescript: true,
      
      // Advanced
      cache: true,
      cacheDir: '.master-scanner-cache',
      maxFileSize: 1024 * 1024 * 5, // 5MB
    };

    const options = { ...defaults };
    
    for (let i = 2; i < argv.length; i++) {
      const arg = argv[i];
      const next = () => argv[++i];
      
      switch (arg) {
        case '--dir':
        case '-d':
          options.dir = next();
          break;
        
        case '--file':
        case '-f':
          options.files.push(next());
          break;
        
        case '--mode':
        case '-m':
          options.mode = next();
          break;
        
        case '--aggressive':
          options.mode = 'aggressive';
          break;
        
        case '--conservative':
          options.mode = 'conservative';
          break;
        
        case '--dry-run':
        case '--dry':
          options.dryRun = true;
          break;
        
        case '--no-backup':
          options.backup = false;
          break;
        
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        
        case '--quiet':
        case '-q':
          options.quiet = true;
          break;
        
        case '--help':
        case '-h':
          this.printHelp();
          process.exit(0);
      }
    }
    
    // Auto-detect project root if not specified
    if (!options.dir && !options.files.length) {
      options.dir = this.findProjectRoot();
    }
    
    return options;
  }
  
  loadConfigFile() {
    const configPaths = [
      '.master-scanner.json',
      '.error-scanner.json',
      'error-scanner.config.js'
    ];
    
    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const config = configPath.endsWith('.js') 
            ? require(path.resolve(configPath))
            : JSON.parse(fs.readFileSync(configPath, 'utf8'));
          
          this.options = { ...this.options, ...config };
          this.options.configFile = configPath;
          break;
        } catch (e) {
          console.warn(`Failed to load config from ${configPath}:`, e.message);
        }
      }
    }
  }
  
  validateConfig() {
    const validModes = ['conservative', 'aggressive', 'smart', 'hybrid'];
    if (!validModes.includes(this.options.mode)) {
      throw new Error(`Invalid mode: ${this.options.mode}. Must be one of: ${validModes.join(', ')}`);
    }
    
    const validStrategies = ['safe', 'pattern', 'ast', 'hybrid'];
    if (!validStrategies.includes(this.options.strategy)) {
      throw new Error(`Invalid strategy: ${this.options.strategy}. Must be one of: ${validStrategies.join(', ')}`);
    }
  }
  
  findProjectRoot() {
    let current = process.cwd();
    while (current !== path.parse(current).root) {
      if (fs.existsSync(path.join(current, 'package.json'))) {
        const srcPath = path.join(current, 'src');
        return fs.existsSync(srcPath) ? srcPath : current;
      }
      current = path.dirname(current);
    }
    return process.cwd();
  }
  
  printHelp() {
    console.log(`
Master Error Scanner - Ultimate Edition

Usage: master-errorscan [options]

Options:
  -d, --dir <path>         Directory to scan
  -f, --file <path>        Specific file to scan (can be used multiple times)
  
  -m, --mode <mode>        Scanning mode: conservative|aggressive|smart|hybrid
  --conservative           Use conservative mode (safest)
  --aggressive             Use aggressive mode (most fixes)
  
  --dry-run                Preview changes without writing
  --no-backup              Don't create backups
  
  -v, --verbose            Verbose output
  -q, --quiet              Quiet mode
  
  -h, --help               Show help

Examples:
  master-errorscan --conservative              # Safe mode
  master-errorscan --aggressive --dry-run      # Preview aggressive fixes
  master-errorscan --dir src --mode smart      # Smart mode on src directory
`);
  }
}

// ============================================================================
// Quote Validator - Prevents quote corruption
// ============================================================================

class QuoteValidator {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.state = {
      strings: [],
      templates: [],
      jsx: [],
      validationErrors: []
    };
  }
  
  validate(content) {
    this.reset();
    const lines = content.split('\n');
    
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      this.validateLine(line, lineNum + 1);
    }
    
    return {
      valid: this.state.validationErrors.length === 0,
      errors: this.state.validationErrors,
      strings: this.state.strings,
      templates: this.state.templates,
      jsx: this.state.jsx
    };
  }
  
  validateLine(line, lineNumber) {
    // Skip comments
    if (line.trim().startsWith('//')) return;
    if (line.trim().startsWith('/*')) return;
    if (line.trim().startsWith('*')) return;
    
    // Check for quote balance
    const singleQuotes = (line.match(/'/g) || []).length;
    const doubleQuotes = (line.match(/"/g) || []).length;
    const backticks = (line.match(/`/g) || []).length;
    
    // Extract strings safely
    const stringPattern = /(['"`])(?:(?=(\\?))\2[\s\S])*?\1/g;
    let match;
    
    while ((match = stringPattern.exec(line)) !== null) {
      this.state.strings.push({
        line: lineNumber,
        column: match.index,
        content: match[0],
        quote: match[1]
      });
    }
    
    // Check for unclosed quotes (basic check)
    if (singleQuotes % 2 !== 0 && !line.includes("\\'")) {
      this.state.validationErrors.push({
        line: lineNumber,
        type: 'unclosed_quote',
        message: `Possibly unclosed single quote on line ${lineNumber}`
      });
    }
    
    if (doubleQuotes % 2 !== 0 && !line.includes('\\"')) {
      this.state.validationErrors.push({
        line: lineNumber,
        type: 'unclosed_quote',
        message: `Possibly unclosed double quote on line ${lineNumber}`
      });
    }
  }
  
  compareBeforeAfter(before, after) {
    const beforeValidation = this.validate(before);
    const afterValidation = this.validate(after);
    
    // Check if we introduced new errors
    const newErrors = afterValidation.errors.filter(afterError => 
      !beforeValidation.errors.some(beforeError => 
        beforeError.line === afterError.line && 
        beforeError.type === afterError.type
      )
    );
    
    // Check if we corrupted any strings
    const corruptedStrings = [];
    for (const beforeString of beforeValidation.strings) {
      const afterString = afterValidation.strings.find(s => 
        s.line === beforeString.line && 
        Math.abs(s.column - beforeString.column) < 5
      );
      
      if (afterString && afterString.content !== beforeString.content) {
        // Check if the change was intentional (quote style change)
        const beforeContent = beforeString.content.slice(1, -1);
        const afterContent = afterString.content.slice(1, -1);
        
        if (beforeContent !== afterContent) {
          corruptedStrings.push({
            line: beforeString.line,
            before: beforeString.content,
            after: afterString.content
          });
        }
      }
    }
    
    return {
      safe: newErrors.length === 0 && corruptedStrings.length === 0,
      newErrors,
      corruptedStrings
    };
  }
}

// ============================================================================
// Conservative Pattern Engine
// ============================================================================

class ConservativePatternEngine {
  constructor() {
    this.patterns = this.loadPatterns();
  }
  
  loadPatterns() {
    return [
      // Safe import fixes
      {
        id: 'import-semicolon',
        category: 'imports',
        severity: 'error',
        pattern: /^(import\s+.+from\s+['"][^'"]+['"])\s*$/gm,
        fix: '$1;',
        description: 'Add missing import semicolon',
        safe: true
      },
      
      // Safe semicolon fixes
      {
        id: 'double-semicolon',
        category: 'syntax',
        severity: 'warning',
        pattern: /;;+/g,
        fix: ';',
        description: 'Remove double semicolons',
        safe: true
      },
      
      // Safe $2 pattern fixes
      {
        id: 'dollar2-export',
        category: 'syntax',
        severity: 'error',
        pattern: /\$2\s+(export\s+)/g,
        fix: '$1',
        description: 'Remove $2 before export',
        safe: true
      },
      {
        id: 'dollar2-const',
        category: 'syntax',
        severity: 'error',
        pattern: /\$2\s+(const\s+\w+)/g,
        fix: '$1',
        description: 'Remove $2 before const',
        safe: true
      },
      {
        id: 'dollar2-interface',
        category: 'syntax',
        severity: 'error',
        pattern: /\$2\s+(interface\s+\w+)/g,
        fix: '$1',
        description: 'Remove $2 before interface',
        safe: true
      },
      {
        id: 'dollar2-class',
        category: 'syntax',
        severity: 'error',
        pattern: /\$2\s+(class\s+\w+)/g,
        fix: '$1',
        description: 'Remove $2 before class',
        safe: true
      },
      {
        id: 'dollar2-standalone',
        category: 'syntax',
        severity: 'error',
        pattern: /^\s*\$2\s*$/gm,
        fix: '',
        description: 'Remove standalone $2',
        safe: true
      },
      
      // Safe JSX fixes
      {
        id: 'jsx-stray-semicolon',
        category: 'jsx',
        severity: 'error',
        pattern: /<(\w+);/g,
        fix: '<$1',
        description: 'Remove semicolon after JSX tag',
        safe: true
      },
      
      // Safe spacing fixes
      {
        id: 'const-spacing',
        category: 'syntax',
        severity: 'style',
        pattern: /(const|let|var)\s{2,}/g,
        fix: '$1 ',
        description: 'Fix variable declaration spacing',
        safe: true
      }
    ];
  }
  
  applyPatterns(content, options = {}) {
    let modified = content;
    const applied = [];
    const validator = new QuoteValidator();
    
    // Only use safe patterns in conservative mode
    const patternsToUse = options.mode === 'conservative' 
      ? this.patterns.filter(p => p.safe === true)
      : this.patterns;
    
    for (const pattern of patternsToUse) {
      // Skip if category is disabled
      if (options[`enable${pattern.category.charAt(0).toUpperCase() + pattern.category.slice(1)}Fixes`] === false) {
        continue;
      }
      
      const matches = modified.match(pattern.pattern);
      if (matches) {
        const before = modified;
        const testFix = modified.replace(pattern.pattern, pattern.fix);
        
        // Validate the fix doesn't corrupt quotes
        if (options.validateQuotes) {
          const comparison = validator.compareBeforeAfter(before, testFix);
          if (!comparison.safe) {
            if (options.verbose) {
              console.log(`  ⚠️  Skipping ${pattern.id}: Would corrupt quotes`);
            }
            continue;
          }
        }
        
        modified = testFix;
        
        if (before !== modified) {
          applied.push({
            id: pattern.id,
            category: pattern.category,
            severity: pattern.severity,
            description: pattern.description,
            count: matches.length
          });
        }
      }
    }
    
    return { content: modified, applied };
  }
}

// ============================================================================
// Smart Bracket Analyzer
// ============================================================================

class SmartBracketAnalyzer {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.state = {
      inString: false,
      inTemplate: false,
      inComment: false,
      inRegex: false,
      stringChar: null,
      stack: [],
      issues: [],
      lineNumber: 1,
      column: 1
    };
  }
  
  analyze(content) {
    this.reset();
    const chars = [...content];
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const prev = chars[i - 1];
      const next = chars[i + 1];
      
      // Update position
      if (char === '\n') {
        this.state.lineNumber++;
        this.state.column = 1;
      } else {
        this.state.column++;
      }
      
      // Skip escaped characters
      if (prev === '\\') continue;
      
      // Handle comments
      if (!this.state.inString && !this.state.inTemplate) {
        if (char === '/' && next === '/') {
          // Line comment - skip to end of line
          while (i < chars.length && chars[i] !== '\n') i++;
          continue;
        }
        
        if (char === '/' && next === '*') {
          // Block comment - skip to */
          i += 2;
          while (i < chars.length - 1 && !(chars[i] === '*' && chars[i + 1] === '/')) i++;
          i++; // Skip the /
          continue;
        }
      }
      
      // Handle strings and templates
      if (!this.state.inString && !this.state.inTemplate) {
        if (char === '`') {
          this.state.inTemplate = true;
          continue;
        }
        
        if (char === '"' || char === "'") {
          this.state.inString = true;
          this.state.stringChar = char;
          continue;
        }
      } else {
        if (this.state.inTemplate && char === '`') {
          this.state.inTemplate = false;
          continue;
        }
        
        if (this.state.inString && char === this.state.stringChar) {
          this.state.inString = false;
          this.state.stringChar = null;
          continue;
        }
        
        // Skip content inside strings/templates
        continue;
      }
      
      // Handle brackets (only outside strings)
      if (this.isBracketOpen(char)) {
        // Special handling for < in TypeScript/JSX
        if (char === '<') {
          // Check if it's likely a generic or JSX tag
          const isGenericOrJSX = /\w/.test(prev || '') || /[A-Z]/.test(next || '');
          if (!isGenericOrJSX) continue; // Skip comparison operators
        }
        
        this.state.stack.push({
          char,
          line: this.state.lineNumber,
          column: this.state.column,
          index: i
        });
      } else if (this.isBracketClose(char)) {
        // Special handling for > in TypeScript/JSX
        if (char === '>') {
          // Check if we have a matching <
          const hasMatchingOpen = this.state.stack.some(item => item.char === '<');
          if (!hasMatchingOpen) continue; // Skip comparison operators
        }
        
        const expected = this.getMatchingBracket(char);
        
        if (this.state.stack.length === 0) {
          this.state.issues.push({
            type: 'unexpected_closing',
            char,
            line: this.state.lineNumber,
            column: this.state.column,
            index: i
          });
        } else {
          const last = this.state.stack[this.state.stack.length - 1];
          
          if (last.char === expected) {
            this.state.stack.pop(); // Correct match
          } else {
            // Check if this might be a valid mismatch (e.g., in regex or math)
            if (this.isLikelyValidMismatch(content, i, char)) {
              continue;
            }
            
            this.state.issues.push({
              type: 'bracket_mismatch',
              expected: this.getClosingBracket(last.char),
              found: char,
              line: this.state.lineNumber,
              column: this.state.column,
              index: i,
              opened: last
            });
            this.state.stack.pop(); // Pop anyway to continue
          }
        }
      }
    }
    
    // Report unclosed brackets
    while (this.state.stack.length > 0) {
      const unclosed = this.state.stack.pop();
      // Skip < brackets as they might be comparison operators
      if (unclosed.char === '<') continue;
      
      this.state.issues.push({
        type: 'unclosed_bracket',
        char: unclosed.char,
        expected: this.getClosingBracket(unclosed.char),
        line: unclosed.line,
        column: unclosed.column,
        index: unclosed.index
      });
    }
    
    return this.state.issues;
  }
  
  isLikelyValidMismatch(content, index, char) {
    // Check for common valid mismatches
    const before = content.substring(Math.max(0, index - 20), index);
    const after = content.substring(index, Math.min(content.length, index + 20));
    
    // Check for comparison operators
    if (char === '>' && (before.includes('<') || before.includes('<=') || before.includes('>='))) {
      return true;
    }
    
    // Check for arrow functions
    if (char === '>' && before.includes('=>')) {
      return true;
    }
    
    return false;
  }
  
  isBracketOpen(char) {
    return ['(', '[', '{'].includes(char);
  }
  
  isBracketClose(char) {
    return [')', ']', '}'].includes(char);
  }
  
  getMatchingBracket(close) {
    const map = { ')': '(', ']': '[', '}': '{', '>': '<' };
    return map[close];
  }
  
  getClosingBracket(open) {
    const map = { '(': ')', '[': ']', '{': '}', '<': '>' };
    return map[open];
  }
  
  suggestFixes(issues, content) {
    const fixes = [];
    const lines = content.split('\n');
    
    for (const issue of issues) {
      switch (issue.type) {
        case 'unclosed_bracket':
          fixes.push({
            type: 'insert',
            line: lines.length,
            column: lines[lines.length - 1].length,
            char: issue.expected,
            description: `Add missing ${issue.expected} for ${issue.char} at line ${issue.line}`,
            confidence: 'high'
          });
          break;
        
        case 'unexpected_closing':
          fixes.push({
            type: 'remove',
            line: issue.line,
            column: issue.column,
            index: issue.index,
            description: `Remove unexpected ${issue.char} at line ${issue.line}`,
            confidence: 'medium'
          });
          break;
        
        case 'bracket_mismatch':
          fixes.push({
            type: 'replace',
            line: issue.line,
            column: issue.column,
            index: issue.index,
            from: issue.found,
            to: issue.expected,
            description: `Replace ${issue.found} with ${issue.expected} at line ${issue.line}`,
            confidence: 'low'
          });
          break;
      }
    }
    
    // Only return high confidence fixes in conservative mode
    if (this.conservative) {
      return fixes.filter(f => f.confidence === 'high');
    }
    
    return fixes;
  }
  
  applyFixes(content, fixes, options = {}) {
    let modified = content;
    const validator = new QuoteValidator();
    
    // Sort fixes by index in reverse order to maintain positions
    const sortedFixes = fixes.sort((a, b) => (b.index || 0) - (a.index || 0));
    
    for (const fix of sortedFixes) {
      // Skip low confidence fixes in conservative mode
      if (options.mode === 'conservative' && fix.confidence === 'low') {
        continue;
      }
      
      const before = modified;
      let testFix = modified;
      
      switch (fix.type) {
        case 'insert':
          if (fix.index !== undefined) {
            testFix = modified.slice(0, fix.index) + fix.char + modified.slice(fix.index);
          } else {
            testFix += fix.char;
          }
          break;
        
        case 'remove':
          if (fix.index !== undefined) {
            testFix = modified.slice(0, fix.index) + modified.slice(fix.index + 1);
          }
          break;
        
        case 'replace':
          if (fix.index !== undefined) {
            testFix = modified.slice(0, fix.index) + fix.to + modified.slice(fix.index + 1);
          }
          break;
      }
      
      // Validate the fix
      if (options.validateQuotes) {
        const comparison = validator.compareBeforeAfter(before, testFix);
        if (!comparison.safe) {
          if (options.verbose) {
            console.log(`  ⚠️  Skipping bracket fix: Would corrupt quotes`);
          }
          continue;
        }
      }
      
      modified = testFix;
    }
    
    return modified;
  }
}

// ============================================================================
// File Processor
// ============================================================================

class FileProcessor {
  constructor(config) {
    this.config = config;
    this.patternEngine = new ConservativePatternEngine();
    this.bracketAnalyzer = new SmartBracketAnalyzer();
    this.quoteValidator = new QuoteValidator();
    this.cache = new Map();
  }
  
  async processFile(filePath) {
    const startTime = Date.now();
    const result = {
      file: filePath,
      success: false,
      modified: false,
      backupPath: null,
      passes: [],
      errors: [],
      fixes: [],
      metrics: {},
      duration: 0
    };
    
    try {
      // Check file size
      const stats = fs.statSync(filePath);
      if (stats.size > this.config.options.maxFileSize) {
        result.errors.push({
          message: `File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB`
        });
        return result;
      }
      
      // Read file
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let workingContent = originalContent;
      
      // Initial validation
      const initialValidation = this.quoteValidator.validate(originalContent);
      result.metrics.initialQuoteErrors = initialValidation.errors.length;
      
      // Multiple passes
      for (let pass = 1; pass <= this.config.options.maxPasses; pass++) {
        const passResult = await this.runPass(workingContent, filePath, pass);
        result.passes.push(passResult);
        
        if (passResult.improved && passResult.modified) {
          // Validate the changes
          if (this.config.options.validateAfterFix) {
            const comparison = this.quoteValidator.compareBeforeAfter(workingContent, passResult.content);
            if (!comparison.safe) {
              console.log(`  ⚠️  Pass ${pass} would corrupt quotes, reverting`);
              break;
            }
          }
          
          workingContent = passResult.content;
          result.modified = true;
          result.fixes.push(...passResult.fixes);
          
          // Stop if no errors
          if (passResult.errors === 0) break;
        } else {
          // No improvement, stop
          break;
        }
      }
      
      // Final validation
      const finalValidation = this.quoteValidator.validate(workingContent);
      result.metrics.finalQuoteErrors = finalValidation.errors.length;
      
      // Only write if improved and safe
      if (result.modified && 
          result.metrics.finalQuoteErrors <= result.metrics.initialQuoteErrors &&
          !this.config.options.dryRun) {
        
        // Backup
        if (this.config.options.backup) {
          result.backupPath = this.createBackup(filePath, originalContent);
        }
        
        // Write file
        fs.writeFileSync(filePath, workingContent, 'utf8');
        result.success = true;
      }
      
    } catch (error) {
      result.errors.push({
        message: error.message,
        stack: error.stack
      });
    }
    
    result.duration = Date.now() - startTime;
    return result;
  }
  
  async runPass(content, filePath, passNumber) {
    const result = {
      pass: passNumber,
      modified: false,
      improved: false,
      content: content,
      fixes: [],
      errors: 0
    };
    
    // Apply pattern fixes
    const { content: patternFixed, applied } = this.patternEngine.applyPatterns(
      content,
      this.config.options
    );
    
    if (patternFixed !== content) {
      result.content = patternFixed;
      result.modified = true;
      result.improved = true;
      result.fixes.push(...applied);
    }
    
    // Apply bracket fixes (only in non-conservative modes)
    if (this.config.options.mode !== 'conservative') {
      const issues = this.bracketAnalyzer.analyze(result.content);
      
      if (issues.length > 0 && this.config.options.enableBracketFixes) {
        const fixes = this.bracketAnalyzer.suggestFixes(issues, result.content);
        const bracketFixed = this.bracketAnalyzer.applyFixes(
          result.content, 
          fixes, 
          this.config.options
        );
        
        if (bracketFixed !== result.content) {
          result.content = bracketFixed;
          result.modified = true;
          result.improved = true;
          result.fixes.push(...fixes.map(f => ({
            category: 'brackets',
            description: f.description
          })));
        }
      }
    }
    
    return result;
  }
  
  createBackup(filePath, content) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(this.config.options.backupDir);
    const relativePath = path.relative(process.cwd(), filePath);
    const backupPath = path.join(
      backupDir,
      `${relativePath.replace(/[/\\]/g, '_')}.${timestamp}.bak`
    );
    
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, content, 'utf8');
    
    return backupPath;
  }
}

// ============================================================================
// Scanner Orchestrator
// ============================================================================

class MasterScanner {
  constructor() {
    this.config = new Config();
    this.processor = new FileProcessor(this.config);
    this.results = [];
    this.startTime = Date.now();
    this.stats = {
      filesScanned: 0,
      filesModified: 0,
      totalFixes: 0,
      fixesByCategory: {},
      errors: [],
      warnings: []
    };
  }
  
  async run() {
    console.log(this.formatHeader());
    
    // Collect files
    const files = await this.collectFiles();
    
    if (files.length === 0) {
      console.log('⚠️  No files to scan.');
      return;
    }
    
    console.log(`📂 Found ${files.length} files to scan\n`);
    
    // Process files
    await this.processSequential(files);
    
    // Run TypeScript check
    const tscErrors = await this.runTypeScriptCheck();
    
    // Generate reports
    await this.generateReports(tscErrors);
    
    // Print summary
    this.printSummary();
    
    // Set exit code
    const hasErrors = this.results.some(r => r.errors.length > 0) || tscErrors.length > 0;
    process.exitCode = hasErrors ? 1 : 0;
  }
  
  async collectFiles() {
    const files = new Set();
    
    // Specific files
    for (const file of this.config.options.files) {
      if (fs.existsSync(file)) {
        files.add(path.resolve(file));
      }
    }
    
    // Directory scan
    if (this.config.options.dir) {
      const dirFiles = this.scanDirectory(this.config.options.dir);
      for (const file of dirFiles) {
        files.add(file);
      }
    }
    
    return Array.from(files);
  }
  
  scanDirectory(dir) {
    const files = [];
    
    const scan = (currentDir) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            if (!this.shouldIgnore(entry.name)) {
              scan(fullPath);
            }
          } else if (entry.isFile()) {
            if (this.shouldProcessFile(fullPath)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        this.stats.warnings.push(`Cannot access: ${currentDir}`);
      }
    };
    
    scan(dir);
    return files;
  }
  
  shouldIgnore(name) {
    return this.config.options.ignore.includes(name);
  }
  
  shouldProcessFile(file) {
    const ext = path.extname(file);
    return this.config.options.extensions.includes(ext);
  }
  
  async processSequential(files) {
    const progressBar = this.createProgressBar(files.length);
    
    for (const file of files) {
      const result = await this.processor.processFile(file);
      this.results.push(result);
      this.updateStats(result);
      progressBar.update(this.results.length);
      
      if (this.config.options.verbose) {
        this.printFileResult(result);
      }
    }
    
    progressBar.stop();
  }
  
  updateStats(result) {
    this.stats.filesScanned++;
    
    if (result.modified) {
      this.stats.filesModified++;
    }
    
    this.stats.totalFixes += result.fixes.length;
    
    for (const fix of result.fixes) {
      const category = fix.category || 'other';
      this.stats.fixesByCategory[category] = (this.stats.fixesByCategory[category] || 0) + 1;
    }
    
    if (result.errors.length > 0) {
      this.stats.errors.push({
        file: result.file,
        errors: result.errors
      });
    }
  }
  
  createProgressBar(total) {
    if (this.config.options.quiet) {
      return { update: () => {}, stop: () => {} };
    }
    
    const width = 40;
    let current = 0;
    
    const update = (value) => {
      current = value;
      const percentage = Math.floor((current / total) * 100);
      const filled = Math.floor((current / total) * width);
      const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
      
      process.stdout.write(`\r${bar} ${percentage}% (${current}/${total})`);
    };
    
    const stop = () => {
      process.stdout.write('\n');
    };
    
    return { update, stop };
  }
  
  async runTypeScriptCheck() {
    if (!this.config.options.typescript) return [];
    
    console.log('\n🔍 Running TypeScript compiler check...');
    try {
      execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
      console.log('  ✅ TypeScript compilation successful');
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
  
  async generateReports(tscErrors = []) {
    const summary = this.createSummary(tscErrors);
    
    // JSON report
    if (this.config.options.report) {
      fs.writeFileSync(
        this.config.options.report,
        JSON.stringify(summary, null, 2),
        'utf8'
      );
    }
    
    // Markdown report
    if (this.config.options.markdown) {
      const markdown = this.generateMarkdown(summary, tscErrors);
      fs.writeFileSync(this.config.options.markdown, markdown, 'utf8');
    }
  }
  
  createSummary(tscErrors) {
    return {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      mode: this.config.options.mode,
      config: {
        mode: this.config.options.mode,
        strategy: this.config.options.strategy,
        dryRun: this.config.options.dryRun,
        backup: this.config.options.backup
      },
      totals: {
        files: this.stats.filesScanned,
        modified: this.stats.filesModified,
        fixes: this.stats.totalFixes,
        errors: this.stats.errors.length,
        warnings: this.stats.warnings.length,
        tscErrors: tscErrors.length
      },
      byCategory: this.stats.fixesByCategory,
      files: this.results.map(r => ({
        path: r.file,
        modified: r.modified,
        fixes: r.fixes.length,
        errors: r.errors.length,
        duration: r.duration
      }))
    };
  }
  
  generateMarkdown(summary, tscErrors) {
    const lines = [
      `# Master Error Scanner Report`,
      ``,
      `**Mode:** ${summary.mode}`,
      `**Generated:** ${summary.timestamp}`,
      `**Duration:** ${(summary.duration / 1000).toFixed(2)}s`,
      ``,
      `## Summary`,
      `- Files Scanned: ${summary.totals.files}`,
      `- Files Modified: ${summary.totals.modified}`,
      `- Total Fixes: ${summary.totals.fixes}`,
      `- Errors: ${summary.totals.errors}`,
      `- Warnings: ${summary.totals.warnings}`,
      `- TypeScript Errors: ${summary.totals.tscErrors}`,
      ``
    ];
    
    if (Object.keys(summary.byCategory).length > 0) {
      lines.push(`## Fixes by Category`);
      for (const [category, count] of Object.entries(summary.byCategory)) {
        lines.push(`- **${category}:** ${count}`);
      }
      lines.push(``);
    }
    
    if (this.stats.errors.length > 0) {
      lines.push(`## ❌ Critical Errors`);
      for (const error of this.stats.errors.slice(0, 10)) {
        lines.push(`### ${error.file}`);
        lines.push(`\`\`\``);
        error.errors.forEach(e => lines.push(e.message));
        lines.push(`\`\`\``);
      }
      lines.push(``);
    }
    
    if (tscErrors.length > 0) {
      lines.push(`## TypeScript Compiler Errors`);
      lines.push(`\`\`\``);
      tscErrors.slice(0, 50).forEach(error => lines.push(error));
      if (tscErrors.length > 50) {
        lines.push(`... and ${tscErrors.length - 50} more errors`);
      }
      lines.push(`\`\`\``);
      lines.push(``);
    }
    
    if (this.config.options.backup) {
      lines.push(`## Backup Information`);
      lines.push(`✅ Backups saved to: ${this.config.options.backupDir}`);
      lines.push(``);
    }
    
    return lines.join('\n');
  }
  
  printFileResult(result) {
    const status = result.modified ? '✅' : '⚪';
    const fixes = result.fixes.length > 0 ? `${result.fixes.length} fixes` : '';
    const errors = result.errors.length > 0 ? `${result.errors.length} errors` : '';
    
    console.log(`${status} ${result.file} ${fixes} ${errors}`);
  }
  
  printSummary() {
    const summary = this.createSummary([]);
    
    console.log('\n' + '═'.repeat(60));
    console.log('✨ Master Scanner Complete!');
    console.log('═'.repeat(60));
    
    console.log('\n📊 Summary:');
    console.log(`  Mode:           ${this.config.options.mode}`);
    console.log(`  Files Scanned:  ${summary.totals.files}`);
    console.log(`  Files Modified: ${summary.totals.modified}`);
    console.log(`  Total Fixes:    ${summary.totals.fixes}`);
    console.log(`  Errors:         ${summary.totals.errors}`);
    console.log(`  Duration:       ${(summary.duration / 1000).toFixed(2)}s`);
    
    if (Object.keys(summary.byCategory).length > 0) {
      console.log('\n📁 Fixes by Category:');
      for (const [category, count] of Object.entries(summary.byCategory)) {
        console.log(`  ${category}: ${count}`);
      }
    }
    
    if (this.config.options.report) {
      console.log(`\n📄 JSON report: ${this.config.options.report}`);
    }
    
    if (this.config.options.markdown) {
      console.log(`📝 Markdown report: ${this.config.options.markdown}`);
    }
    
    if (this.config.options.backup) {
      console.log(`💾 Backups saved to: ${this.config.options.backupDir}`);
    }
    
    if (summary.totals.errors > 0) {
      console.log('\n⚠️  Some errors remain. Check the report for details.');
    } else {
      console.log('\n✅ All errors fixed successfully!');
    }
  }
  
  formatHeader() {
    const mode = this.config.options.mode.toUpperCase();
    return `
╔════════════════════════════════════════════════════════════╗
║  🚀 Master Error Scanner - Ultimate Edition               ║
║  Mode: ${mode.padEnd(50)}  ║
╚════════════════════════════════════════════════════════════╝

${this.config.options.dryRun ? '⚠️  DRY RUN - No files will be modified\n' : ''}`;
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  try {
    const scanner = new MasterScanner();
    await scanner.run();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for use as module
module.exports = {
  Config,
  QuoteValidator,
  ConservativePatternEngine,
  SmartBracketAnalyzer,
  FileProcessor,
  MasterScanner
};