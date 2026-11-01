import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['test/**/*.test.ts'],
    // Reading the packages' source and compiling the handbooks' samples take seconds, not ms.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
})
