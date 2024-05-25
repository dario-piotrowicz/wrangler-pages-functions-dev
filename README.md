# `wrangler-pages-functions-dev`

`wrangler-pages-functions-dev` is a Vite plugin that can be used to handle [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) during local development.

It can be useful for example when working on a single page application that makes use of Pages Functions.

## Usage

Install the package as a dev dependency alongside wrangler:
```sh
npm i -D wrangler-pages-functions-dev wrangler
```

To use the plugin with `vite dev` simply update your vite config file to include the plugin and to specify which routes it should handle, for example:

```diff
export default defineConfig({
  plugins: [
+    wranglerPagesFunctionsDev({
+      matchRoutes: /api/,
+    }),
    // ...
  ],
})
```

You can preview or deploy you application with `wrangler pages` in the same exact way as you would without this plugin (this plugin only effects `vite dev` everything else works exactly the same as it would otherwise).
