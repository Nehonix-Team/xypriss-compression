import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { execSync } from "child_process";

const repo = "Nehonix-Team/xypriss-compression-plugin";
const osName = process.platform;
const archName = process.arch;
const ext = osName === "win32" ? ".exe" : "";
const binName = `xlibc-${osName}-${archName}${ext}`;

const distDir = path.resolve(__dirname, "../dist");
const outPath = path.join(distDir, binName);

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

function getLatestRelease() {
  return new Promise<any>((resolve, reject) => {
    https
      .get(
        `https://api.github.com/repos/${repo}/releases/latest`,
        {
          headers: { "User-Agent": "xypriss-installer" },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(
                new Error(`Failed to fetch release: ${res.statusCode} ${data}`),
              );
            }
          });
        },
      )
      .on("error", reject);
  });
}

function downloadBinary(url: string, dest: string) {
  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "xypriss-installer",
            Accept: "application/octet-stream",
          },
        },
        (res) => {
          if (res.statusCode === 302 || res.statusCode === 301) {
            downloadBinary(res.headers.location!, dest)
              .then(resolve)
              .catch(reject);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`Failed to download: ${res.statusCode}`));
            return;
          }
          res.pipe(file);
          file.on("finish", () => {
            file.close();
            if (osName !== "win32") {
              fs.chmodSync(dest, 0o755);
            }
            resolve();
          });
        },
      )
      .on("error", (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
}

async function install() {
  console.log(`Installing ${binName} from GitHub Releases...`);
  try {
    const release = await getLatestRelease();
    const asset = release.assets?.find((a: any) => a.name === binName);
    if (asset) {
      console.log(
        `Downloading from GitHub Releases: ${asset.browser_download_url}`,
      );
      await downloadBinary(asset.browser_download_url, outPath);
      console.log("Download successful!");
      return;
    }
    console.log(`Binary ${binName} not found in latest release.`);
  } catch (e: any) {
    console.warn(`Could not fetch GitHub Release: ${e.message}`);
  }

  // Fallback
  console.log("Attempting to build from source as fallback...");
  try {
    execSync(`go build -o "../dist/${binName}" main.go`, {
      cwd: path.resolve(__dirname, "../lib"),
      stdio: "inherit",
    });
    console.log("Built from source successfully.");
  } catch (e) {
    console.error(
      "Failed to build from source. Please ensure Go is installed.",
    );
    process.exit(1);
  }
}

install();
