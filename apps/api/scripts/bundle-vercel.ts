import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const walkParents = (start: string): string[] => {
  const directories = [start];
  let current = start;

  for (let index = 0; index < 8; index += 1) {
    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    directories.push(parent);
    current = parent;
  }

  return directories;
};

const findRepoRoot = (): string => {
  const candidates = walkParents(process.cwd()).concat(
    walkParents(import.meta.dir),
  );

  for (const directory of candidates) {
    if (existsSync(join(directory, "bun.lock"))) {
      return directory;
    }
  }

  return process.cwd();
};

const writeFunction = async (functionDir: string): Promise<void> => {
  mkdirSync(functionDir, { recursive: true });

  const build = await Bun.build({
    entrypoints: [join(import.meta.dir, "../src/vercel-entry.ts")],
    outdir: functionDir,
    target: "node",
    format: "esm",
    naming: "index.js",
  });

  if (!build.success) {
    for (const log of build.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  writeFileSync(
    join(functionDir, "package.json"),
    `${JSON.stringify({ type: "module" }, null, 2)}\n`,
  );
  writeFileSync(
    join(functionDir, ".vc-config.json"),
    `${JSON.stringify(
      {
        runtime: "nodejs22.x",
        handler: "index.js",
        launcherType: "Nodejs",
        shouldAddHelpers: true,
        maxDuration: 30,
      },
      null,
      2,
    )}\n`,
  );
};

const writeOutput = async (root: string): Promise<void> => {
  const outputRoot = join(root, ".vercel/output");
  const staticDir = join(outputRoot, "static");

  mkdirSync(staticDir, { recursive: true });
  writeFileSync(join(staticDir, "robots.txt"), "User-agent: *\nDisallow: /\n");

  await writeFunction(join(outputRoot, "functions/index.func"));
  await writeFunction(join(outputRoot, "functions/[[...path]].func"));

  writeFileSync(
    join(outputRoot, "config.json"),
    `${JSON.stringify(
      {
        version: 3,
        routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/" }],
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Wrote Vercel Build Output API to ${outputRoot}`);
};

const repoRoot = findRepoRoot();
const outputRoots = new Set([repoRoot, process.cwd()]);

for (const root of outputRoots) {
  await writeOutput(root);
}
