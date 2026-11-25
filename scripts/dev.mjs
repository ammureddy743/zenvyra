import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const frontendDir = path.join(rootDir, "frontend");
const backendDir = path.join(rootDir, "backend");

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

const venvPython = isWin
  ? path.join(backendDir, ".venv", "Scripts", "python.exe")
  : path.join(backendDir, ".venv", "bin", "python");

const pythonCmd = existsSync(venvPython) ? venvPython : "python";

const children = [];

function startProcess(label, command, args, cwd) {
  const proc = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: isWin && command.endsWith(".cmd"),
  });

  proc.on("error", (err) => {
    console.error(`[${label}] Failed to start: ${err.message}`);
    if (label === "backend" && err.code === "ENOENT") {
      console.error(
        "[backend] Python was not found. Install Python 3.11+ and set up backend/.venv."
      );
    }
  });

  proc.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`[${label}] Exited with code ${code}`);
    }
  });

  children.push(proc);
  return proc;
}

console.log("Starting Zenvyra (frontend + backend)...");

startProcess(
  "backend",
  pythonCmd,
  ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
  backendDir
);

startProcess("frontend", npmCmd, ["run", "dev"], frontendDir);

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
