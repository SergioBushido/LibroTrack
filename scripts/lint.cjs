const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const rootDir = path.resolve(__dirname, '..');
const tsconfigPath = path.join(rootDir, 'tsconfig.json');

const errors = [];

// 1. TypeScript compiler check with unused locals enforcement
const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
if (configFile.error) {
  console.error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
  process.exit(1);
}

const parsed = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  rootDir,
  {
    noEmit: true,
    noUnusedLocals: true,
  },
);

const program = ts.createProgram(parsed.fileNames, parsed.options);
const diagnostics = ts.getPreEmitDiagnostics(program);

for (const diagnostic of diagnostics) {
  if (!diagnostic.file) continue;
  const rel = path.relative(rootDir, diagnostic.file.fileName).replace(/\\/g, '/');
  if (!rel.startsWith('src/') && rel !== 'App.tsx') continue;
  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start || 0);
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  errors.push(`${rel}:${line + 1}:${character + 1} [TS${diagnostic.code}] ${message}`);
}

// 2. AST & static hygiene rules on src/ and App.tsx
const sourceFiles = program
  .getSourceFiles()
  .filter(file => {
    const rel = path.relative(rootDir, file.fileName).replace(/\\/g, '/');
    return (rel.startsWith('src/') || rel === 'App.tsx') && !file.isDeclarationFile;
  });

for (const sourceFile of sourceFiles) {
  const rel = path.relative(rootDir, sourceFile.fileName).replace(/\\/g, '/');

  const visit = node => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      errors.push(`${rel}:${line + 1}:${character + 1} [no-explicit-any] Evita el uso de \`any\`.`);
    }

    if (
      ts.isSpreadAssignment(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'shadow' &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'theme'
    ) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      errors.push(`${rel}:${line + 1}:${character + 1} [invalid-shadow-spread] Usa \`...theme.shadow.soft\` o \`...theme.shadow.medium\`.`);
    }

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'console' &&
      node.expression.name.text === 'log'
    ) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      errors.push(`${rel}:${line + 1}:${character + 1} [no-console-log] Elimina \`console.log\` de código de producción.`);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

if (errors.length > 0) {
  console.error(`Lint encontró ${errors.length} problema(s):\n${errors.join('\n')}`);
  process.exit(1);
}

console.log(`Lint OK (${sourceFiles.length} archivos verificados: 0 unused locals, 0 any, 0 invalid theme.shadow, 0 console.log).`);
