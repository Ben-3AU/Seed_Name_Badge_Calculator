import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
    input: 'src/components/widget.js',
    output: {
        file: 'dist/widget.min.js',
        format: 'iife',
        name: 'TerraTagCalculator',
        sourcemap: true
    },
    plugins: [
        nodeResolve(),
        terser({
            format: {
                comments: false
            }
        })
    ]
}; 