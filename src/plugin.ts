import { Plugin } from "vite";
import httpProxy from "http-proxy";
import { spawnWranglerPagesDev } from "./wrangler";

/**
 * Factory function that generates a vite plugin that handles requests for Pages Functions using wrangler
 *
 * @param options Options for tweaking the plugin's behavior
 * @returns the vite plugin
 */
export function plugin(options: PluginOptions): Plugin<null> {
  return {
    name: "wrangler-pages-functions-dev",
    async configureServer(server) {
      const wranglerPagesDevOutput = await spawnWranglerPagesDev({
        onWranglerRestart: () => {
          if (options.reloadOnPagesFunctionsChanges !== false) {
            server.hot.send({ type: "full-reload" });
          }
        },
      });

      if ("errorMessage" in wranglerPagesDevOutput) {
        console.error(`\x1b[33m
        ERROR: Failed to start \`wrangler pages dev\`, the Pages Functions handling is disabled!
        
        The error that occurred when trying to start the wrangler process is:
        ${wranglerPagesDevOutput.errorMessage}
        \\x1b[0m`.replace(/\n {8}/g, '\n').replace(/(^\n|\n$)/, ''));
        return;
      }

      const proxy = httpProxy.createProxyServer();

      const wranglerUrl = wranglerPagesDevOutput.url;

      const testUrl = getTestUrl(options.matchRoutes);

      server.middlewares.use((req, res, next) => {
        if (!req.url || !testUrl(req.url)) {
          next();
          return;
        }

        req.url = `${wranglerUrl}${req.url}`;

        proxy.web(req, res, { target: wranglerUrl }, (e) => {
          console.error(e);
          next(e);
        });
      });
    },
  };
}

export type PluginOptions = {
  /** Regular expression(s) to indicate what routes should be handled by Pages functions
   *
   * Example:
   *  - matchRoutes: /^\/api\// only handles requests to /api/... routes
   */
  matchRoutes: RegExp | RegExp[];
  /** Whether when there are Pages functions changes a full page reload should be triggered
   * (so that web pages fetching from Pages functions can be refreshed and get the updated values)
   *
   * default: true
   */
  reloadOnPagesFunctionsChanges?: boolean;
};

function getTestUrl(
  matchRoutes: PluginOptions["matchRoutes"]
): (url: string) => boolean {
  if (Array.isArray(matchRoutes)) {
    return (url: string) => matchRoutes.some((regexp) => regexp.test(url));
  }
  return (url: string) => matchRoutes.test(url);
}
