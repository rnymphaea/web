import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pages = ['users', 'friends', 'news', 'messages'];

export default {
    mode: 'production',

    entry: {
        main: './src/client/less/main.less',
        users: './src/client/js/users.js',
        friends: './src/client/js/friends.js',
        news: './src/client/js/news.js',
        messages: './src/client/js/messages.js'
    },

    output: {
        path: path.resolve(__dirname, 'dist-webpack'),
        filename: 'js/[name].js',
        clean: true
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ['@babel/plugin-syntax-dynamic-import']
                    }
                }
            },
            {
                test: /\.less$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            },
            {
                test: /\.pug$/,
                use: [{ loader: 'pug-loader', options: { pretty: false } }]
            },
            {
                test: /\.(woff2?|eot|ttf|otf)$/,
                type: 'asset/resource',
                generator: { filename: 'fonts/[name].[ext]' }
            }
        ]
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: 'css/[name].css',
            ignoreOrder: true
        }),

        ...pages.map(page => new HtmlWebpackPlugin({
            template: `./src/client/views/${page}.pug`,
            filename: `html/${page}.html`,
            chunks: [page, 'main']
        })),

        new HtmlWebpackPlugin({
            template: './src/client/views/users.pug',
            filename: 'html/index.html',
            chunks: ['users', 'main']
        }),

        new CopyPlugin({
            patterns: [
                { from: 'src/client/images', to: 'images' }
            ]
        })
    ],

    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },

    resolve: {
        extensions: ['.js', '.less', '.css']
    }
};
