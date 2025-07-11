/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_DOMAIN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
