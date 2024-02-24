const esbuild = require('esbuild')

esbuild.build({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode', 'proxy-agent'] // 指定要忽略的模块
}).catch(() => process.exit(1))
