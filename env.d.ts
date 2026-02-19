/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_META_APP_ID: string | undefined;
  readonly VITE_META_CONFIG_ID: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
