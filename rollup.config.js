import babel from '@rollup/plugin-babel'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const extensions = ['.js', '.jsx', '.ts', '.tsx']

const plugins = [
    nodeResolve({ browser: true }),
    typescript(),
    babel({
        exclude: 'node_modules/**',
        extensions,
        babelHelpers: 'bundled',
    }),
]

export default [
    // lib
    {
        input: 'src/index.tsx',
        output: [
            {
                dir: 'dist',
                format: 'esm',
                sourcemap: true, // TODO: export src to the browser too
                preserveModules: true,
                preserveModulesRoot: 'src',
            },
        ],
        plugins: [
            nodeResolve({ browser: true }),
            typescript(),
            babel({
                exclude: 'node_modules/**',
                extensions,
                babelHelpers: 'runtime',
                plugins: [
                    ['@babel/plugin-transform-runtime']
                ]
            }),
        ],
        external: ['solid-js', 'solid-js/web'],
    },
    // bundled esm
    {
        input: 'src/index.tsx',
        output: [
            {
                file: 'dist/index.esm.js',
                format: 'esm',
                sourcemap: true,
            },
        ],
        plugins,
    },
    // bundled cjs
    {
        input: 'src/index.tsx',
        output: [
            {
                name: 'superduperannotate',
                file: 'dist/index.cjs.js',
                format: 'umd',
                sourcemap: true,
            },
        ],
        plugins,
    }
]
