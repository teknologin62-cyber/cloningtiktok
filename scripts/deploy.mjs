
import { spawnSync } from "node:child_process";


function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);

  const isWindows = process.platform === "win32";

  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: isWindows && command === "npm"
  });

  if (result.error) throw result.error;

  if (result.status !== 0) {
    throw new Error(`Perintah gagal: ${command}`);
  }
}


function output(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: false
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || "Git command gagal");
  }

  return result.stdout.trim();
}

try {
  console.log("=== MEMULAI DEPLOY ===");

  // Pastikan branch main
  const branch = output("git", [
    "branch",
    "--show-current"
  ]);

  if (branch !== "main") {
    throw new Error("Deploy hanya diizinkan dari branch main.");
  }

  // Build aplikasi
  run("npm", ["run", "build"]);

  // Tambahkan perubahan
  run("git", ["add", "-A"]);

  // Periksa file yang akan dikirim
  const staged = output("git", [
    "diff",
    "--cached",
    "--name-only"
  ]);

  const files = staged ? staged.split(/\r?\n/) : [];

  const unsafe = files.filter(file =>
    /(^|\/)\.env($|\.)|(^|\/)[^/]*\.(pem|key)$/i.test(file)
  );

  if (unsafe.length > 0) {
    throw new Error(
      "File sensitif terdeteksi:\n" + unsafe.join("\n")
    );
  }

  if (files.length === 0) {
    console.log("\nTidak ada perubahan baru.");
    process.exit(0);
  }

  // Commit
  run("git", [
    "commit",
    "-m",
    "Update aplikasi otomatis"
  ]);

  // Push ke GitHub
  run("git", [
    "push",
    "origin",
    "main"
  ]);

  console.log("\n=== PUSH BERHASIL ===");
  console.log("Vercel akan memproses deployment otomatis.");

} catch (error) {
  console.error("\nDEPLOY GAGAL:", error.message);
  process.exitCode = 1;
}
