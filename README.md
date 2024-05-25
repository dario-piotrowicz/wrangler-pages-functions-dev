# `wrangler-pages-functions-dev`

`wrangler-pages-functions-dev` is a Vite plugin that can be used to handle [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/).

It can be useful for example when working on a single page application that makes use of Pages Functions.

## Usage

After having installed the package (as well as `wrangler` which is a peer-dependency of `wrangler-pages-functions-dev`) simply update your vite config file to include the plugin and to specify which routes it should handle, for example:

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
