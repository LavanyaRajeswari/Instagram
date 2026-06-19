import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
<<<<<<< HEAD
<<<<<<<< HEAD:frontend/vite.config.js
  plugins: [
    react(),
    tailwindcss(),
  ],
});
========
=======
>>>>>>> postInteractions
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: true, 
  },
});
<<<<<<< HEAD
>>>>>>>> postInteractions:Instagram_V1/vite.config.js
=======
>>>>>>> postInteractions
