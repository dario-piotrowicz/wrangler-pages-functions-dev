import { fileURLToPath } from "url";
import { fork } from "node:child_process";

const wranglerBinaryPath = fileURLToPath(
  new URL("../bin/wrangler.js", import.meta.resolve("wrangler"))
);

export async function spawnWranglerPagesDev({
  onWranglerRestart,
}: {
  onWranglerRestart: () => void;
}): Promise<{ url: string } | { errorMessage: string }> {
  let wranglerHasStarted = false;

  const wranglerPromise = new Promise<{ url: string }>((resolve) => {
    fork(wranglerBinaryPath, ["pages", "dev", ".", "--port=0"], {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
    }).on("message", (message) => {
      if (!wranglerHasStarted) {
        wranglerHasStarted = true;
        const parsedMessage = JSON.parse(message.toString());
        resolve({ url: `http://${parsedMessage.ip}:${parsedMessage.port}` });
      } else {
        onWranglerRestart();
      }
    });
  });

  const timeoutPromise = new Promise<{ errorMessage: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        errorMessage:
          "Timeout error, could not hear back from `wrangler pages dev` in a reasonable amount of time",
      });
    }, wranglerProcessStartTimeout);
  });

  return Promise.race([wranglerPromise, timeoutPromise]);
}

/** The amount of time to wait for wrangler pages dev to emit its ready ipc message */
const wranglerProcessStartTimeout = 3_000;
