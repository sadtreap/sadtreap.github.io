import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const asModuleUrl = source =>
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;

/** Load small TS utility modules without Astro's build-time aliases or globals. */
export async function loadModule(filename, { mocks = {}, dev = false } = {}) {
  const modules = new Map();

  async function compile(file) {
    if (modules.has(file)) return modules.get(file);

    const source = await readFile(file, "utf8");
    const { outputText } = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
      },
    });
    let output = outputText.replaceAll("import.meta.env.DEV", String(dev));
    const parsed = ts.createSourceFile(file, output, ts.ScriptTarget.ESNext);
    const imports = parsed.statements.filter(
      statement =>
        (ts.isImportDeclaration(statement) ||
          ts.isExportDeclaration(statement)) &&
        statement.moduleSpecifier
    );

    for (const statement of imports.reverse()) {
      const specifier = statement.moduleSpecifier;
      const name = specifier.text;
      let url;
      if (Object.hasOwn(mocks, name)) {
        url = asModuleUrl(mocks[name]);
      } else if (name.startsWith(".") || name.startsWith("@/")) {
        const path = name.startsWith("@/")
          ? resolve(projectRoot, "src", name.slice(2))
          : resolve(dirname(file), name);
        url = await compile(path.endsWith(".ts") ? path : `${path}.ts`);
      } else {
        const resolved = createRequire(file).resolve(name);
        url = resolved.startsWith("node:")
          ? resolved
          : pathToFileURL(resolved).href;
      }
      output =
        output.slice(0, specifier.getStart(parsed)) +
        JSON.stringify(url) +
        output.slice(specifier.end);
    }

    const url = asModuleUrl(output);
    modules.set(file, url);
    return url;
  }

  return import(await compile(resolve(projectRoot, filename)));
}
