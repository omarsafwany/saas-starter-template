import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "saas-starter-template",
  tagline: "A reusable, batteries-included starter for indie hackers",
  favicon: "img/favicon.ico",

  future: {
    v4: true,
  },

  // Not deployed yet (PERPRO-19, Render deploy, is deliberately deferred -
  // see the Infrastructure > Deployment page). This is a placeholder until
  // a real domain exists; `npm run build` produces a fully working static
  // site regardless of what this is set to.
  url: "https://docs.saas-starter-template.dev",
  baseUrl: "/",

  organizationName: "omarsafwany",
  projectName: "saas-starter-template",

  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/omarsafwany/saas-starter-template/edit/main/docs/docs/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        docsRouteBasePath: "/",
        language: ["en"],
      },
    ],
  ],

  themeConfig: {
    image: "img/social-card.jpg",
    colorMode: {
      defaultMode: "light",
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "saas-starter-template",
      logo: {
        alt: "saas-starter-template logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://github.com/omarsafwany/saas-starter-template",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Getting Started", to: "/" },
            { label: "Patterns", to: "/patterns" },
          ],
        },
        {
          title: "Project",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/omarsafwany/saas-starter-template",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} saas-starter-template. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "json", "diff"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
