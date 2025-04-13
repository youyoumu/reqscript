#!/usr/bin/env tsx
import fs from "fs";
import path from "path";
import ts from "typescript";

const [, , fileArg, fnName] = process.argv;

if (fileArg === "--list") {
  const requestFile = process.argv[3];
  console.log("DEBUG[241]: requestFile=", requestFile);
  if (!requestFile) process.exit(0);

  const absPath = path.resolve(process.cwd(), requestFile);
  if (!fs.existsSync(absPath)) process.exit(0);

  const code = fs.readFileSync(absPath, "utf-8");
  const source = ts.createSourceFile(
    requestFile,
    code,
    ts.ScriptTarget.Latest,
    true,
  );

  ts.forEachChild(source, (node) => {
    if (ts.isFunctionDeclaration(node) && node.name?.text) {
      console.log(node.name.text);
    }
  });

  process.exit(0);
}

const filePath = path.resolve(process.cwd(), fileArg);

let mod;
try {
  mod = await import(filePath);
} catch (err) {
  console.error(`Failed to import ${filePath}`);
  process.exit(1);
}

if (!(fnName in mod)) {
  console.error(`Function "${fnName}" not found in ${fileArg}`);
  process.exit(1);
}

const result = await mod[fnName]();
console.log(JSON.stringify(result, null, 2));
