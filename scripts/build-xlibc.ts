import { exec } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { promisify } from "util";

const execAsync = promisify(exec);

const targets = [
  { os: "linux", arch: "amd64", nodeArch: "x64", ext: "" },
  { os: "linux", arch: "arm64", nodeArch: "arm64", ext: "" },
  { os: "darwin", arch: "amd64", nodeArch: "x64", ext: "" },
  { os: "darwin", arch: "arm64", nodeArch: "arm64", ext: "" },
  { os: "windows", arch: "amd64", nodeArch: "x64", ext: ".exe" },
];

const libDir = path.resolve(__dirname, "../lib");
const distDir = path.resolve(__dirname, "../bin");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

async function buildAll() {
  console.log("Building xlibc binaries for all platforms...");
  for (const target of targets) {
    const osName = target.os === "windows" ? "win32" : target.os;
    const binName = `xlibc-${osName}-${target.nodeArch}${target.ext}`;
    const outPath = path.join(distDir, binName);
    console.log(`Compiling for ${target.os}/${target.arch} -> ${binName}`);

    try {
      await execAsync(`go build -o "${outPath}" main.go`, {
        cwd: libDir,
        env: { ...process.env, GOOS: target.os, GOARCH: target.arch },
      });
    } catch (e) {
      console.error(`Failed to compile ${binName}:`, e);
      process.exit(1);
    }
  }
  console.log("\nAll xlibc builds complete.");
}

buildAll();
