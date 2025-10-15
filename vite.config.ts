import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
	],
	server: {
		// Enable host exposure for WSL2
		host: true, // This exposes to all network interfaces
		port: 5173,
		strictPort: true,
		
		// Optional: Configure CORS if needed
		cors: true,
		
		// Watch configuration for WSL2 file system
		watch: {
			usePolling: true, // Use polling for file changes in WSL2
			interval: 1000, // Poll every second
		},
		
		// HMR configuration for WSL2
		hmr: {
			protocol: 'ws',
			host: 'localhost',
			port: 5173,
			clientPort: 5173,
		}
	},
	
	// Optimize for WSL2 file system
	resolve: {
		// Faster resolution in WSL2
		preferRelative: true,
	},
	
	// Build optimizations
	build: {
		// Improve build performance in WSL2
		cache: true,
	}
});
