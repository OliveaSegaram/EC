/// <reference types="vite/client" />

declare module '*.json' {
  const value: Record<string, any>;
  export default value;
}

// Type declarations for our translation files
declare module '@/locales/*/translation.json' {
  const value: {
    app: {
      title: string;
      switchLanguage: string;
    };
    common: {
      [key: string]: string;
    };
    languages: {
      [key: string]: string;
    };
  };
  export default value;
}
