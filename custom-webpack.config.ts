import type { Configuration } from 'webpack';

module.exports = {
  entry: {
    background: { import: 'src/background.ts', runtime: false },
    contentScript: { import: 'src/contentScript.ts', runtime: false }
  },
} as Configuration;