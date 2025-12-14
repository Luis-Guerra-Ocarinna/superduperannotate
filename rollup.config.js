import babel from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'

export default {
    input: 'src/index.tsx',
    output: [
        {
            file: 'dist/index.js',
            format: 'esm',
        },
    ],
    plugins: [
        typescript(),
        babel({
            exclude: 'node_modules/**',
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            babelHelpers: 'bundled',
        }),
    ],
    external: ['solid-js'],
}
