import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    entry: './client/src/js/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'client/webpack-dist/js')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: { 
                        presets: ['@babel/preset-env'] 
                    }
                }
            }
        ]
    },
    mode: 'production'
};
