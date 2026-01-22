import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega apenas variáveis que começam com VITE_
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    // Nenhuma chave sensível é injetada no bundle manualmente
    // O acesso será feito exclusivamente via import.meta.env
    define: {
      __APP_ENV__: JSON.stringify(env.MODE),
    },
  };
});
