import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    "intro",
    {
      type: "category",
      label: "Backend",
      collapsed: false,
      items: [
        "backend/express",
        "backend/prisma-postgres",
        "backend/better-auth",
        "backend/email",
        "backend/background-jobs",
        "backend/observability",
        "backend/file-storage",
        "backend/payments",
        "backend/testing",
      ],
    },
    {
      type: "category",
      label: "Frontend",
      collapsed: false,
      items: [
        "frontend/vite-react",
        "frontend/react-router",
        "frontend/tanstack-query",
        "frontend/zustand",
        "frontend/tailwind-shadcn",
        "frontend/forms-validation",
        "frontend/seo-aeo",
      ],
    },
    {
      type: "category",
      label: "Infrastructure",
      collapsed: false,
      items: ["infrastructure/ci", "infrastructure/deployment-and-analytics"],
    },
    "patterns",
  ],
};

export default sidebars;
