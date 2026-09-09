import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      // Vendored HyperFrames skill packages (npx skills add) ship their own
      // internal unit tests under these trees. They're not this repo's test
      // suite and aren't wired to run standalone here (some import sibling
      // skills that may not be installed) — exclude them from discovery.
      '.claude/skills/**',
      '.agents/skills/**',
      'videos/**',
    ],
  },
})
