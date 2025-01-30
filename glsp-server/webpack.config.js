const path = require('path');
const buildRoot = path.resolve(__dirname, 'lib');
const appRoot = path.resolve(__dirname, 'dist');

/**@type {import('webpack').Configuration}*/
module.exports = {
    entry: [path.resolve(buildRoot, 'app')],
    output: {
        filename: 'kdl-glsp-server.js',
        path: appRoot
    },
    mode: 'development',
    devtool: 'source-map',
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    target: 'node',
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ['source-map-loader'],
                enforce: 'pre'
            }
        ]
    },
    ignoreWarnings: [/Failed to parse source map/, /Can't resolve .* in '.*ws\/lib'/]
};
