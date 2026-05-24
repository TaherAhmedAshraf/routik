import { defineConfig } from "vitepress";

export default defineConfig({
  title: "routik",
  description:
    "Express router with built-in Zod validation and automatic OpenAPI documentation",
  srcDir: ".",
  head: [
    ["link", { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
  ],
  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "routik",
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/api" },
      { text: "Examples", link: "/examples/crud" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          items: [
            { text: "Introduction", link: "/guide/getting-started" },
            { text: "Installation", link: "/guide/installation" },
            { text: "First Route", link: "/guide/first-route" },
          ],
        },
        {
          text: "Schema Types",
          items: [
            { text: "Overview", link: "/guide/schema-types" },
            { text: "Basic Types", link: "/guide/schema-basic" },
            { text: "Optional & Enum", link: "/guide/schema-optional" },
            { text: "Objects & Arrays", link: "/guide/schema-objects" },
          ],
        },
        {
          text: "Reference",
          items: [
            { text: "Validation", link: "/guide/validation" },
            { text: "Middlewares", link: "/guide/middlewares" },
            { text: "Sub-routers", link: "/guide/sub-routers" },
            { text: "OpenAPI", link: "/guide/openapi" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "Overview", link: "/api" },
            { text: "Type Builders", link: "/api/type-builders" },
          ],
        },
      ],
      "/examples/": [
        {
          text: "Examples",
          items: [
            { text: "CRUD API", link: "/examples/crud" },
            { text: "Full API", link: "/examples/full-api" },
            { text: "Production API", link: "/examples/production" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/example/routik" },
      { icon: "npm", link: "https://www.npmjs.com/package/routik" },
    ],
    search: {
      provider: "local",
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2024-present",
    },
  },
  markdown: {
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
    lineNumbers: false,
  },
});
