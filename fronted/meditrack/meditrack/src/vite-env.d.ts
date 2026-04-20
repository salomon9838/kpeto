// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME?: string;
  // Ajoutez d'autres variables ici
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}