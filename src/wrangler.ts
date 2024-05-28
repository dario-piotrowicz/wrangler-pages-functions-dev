import { fileURLToPath } from "url";
import { fork } from "node:child_process";
import chalk from "chalk";

const wranglerBinaryPath = fileURLToPath(
  new URL("../bin/wrangler.js", import.meta.resolve("wrangler"))
);

export async function spawnWranglerPagesDev({
  onWranglerRestart,
  displayWranglerLogs,
}: {
  onWranglerRestart: () => void;
  displayWranglerLogs: boolean;
}): Promise<{ url: string } | { errorMessage: string }> {
  let wranglerHasStarted = false;

  const wranglerPromise = new Promise<{ url: string }>((resolve) => {
    const wranglerProcess = fork(
      wranglerBinaryPath,
      ["pages", "dev", ".", "--port=0"],
      {
        stdio: ["pipe", "pipe", "pipe", "ipc"],
      }
    ).on("message", (message) => {
      if (!wranglerHasStarted) {
        wranglerHasStarted = true;
        const parsedMessage = JSON.parse(message.toString());
        resolve({ url: `http://${parsedMessage.ip}:${parsedMessage.port}` });
      } else {
        onWranglerRestart();
      }
    });
    if (displayWranglerLogs) {
      wranglerProcess.stdout?.on("data", (data: unknown) =>
        displayWranglerLog(data, "stdout")
      );
      wranglerProcess.stderr?.on("data", (data: unknown) =>
        displayWranglerLog(data, "stderr")
      );
    }
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
const wranglerProcessStartTimeout = 7_000;

/**
 * Displays a Wrangler log to the terminal with some styling
 *
 * @param log the Wrangler log to display
 * @param outputType the output type, either 'stdout' or 'stderr'
 */
function displayWranglerLog(
  log: unknown,
  outputType: "stdout" | "stderr"
): void {
  const logString = `${log ?? ""}`;

  // we remove any possible pre-existing styling applied by wrangler
  // (regex source: https://github.com/chalk/ansi-regex/blob/main/index.js#L3)
  const unstyledLog = `${logString}`.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );

  if (unstyledLog.trim()) {
    const linePrefix = chalk.yellow("⚡");
    const lines = unstyledLog.split("\n");
    lines.forEach((line) => {
      let formattedLine = outputType === "stderr" ? chalk.yellow(line) : line;
      formattedLine = formattedLine.trim()
        ? `${linePrefix} ${formattedLine}\n`
        : "";
      process[outputType].write(`${chalk.dim(formattedLine)}`);
    });
  }
}
