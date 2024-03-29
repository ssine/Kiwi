const path = require('path')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const LiveReloadWebpackPlugin = require('@kooneko/livereload-webpack-plugin')

module.exports = {
  devtool: process.env.WEBPACK_MODE === 'production' ? 'cheap-module-source-map' : undefined,
  entry: {
    app: './src/ui/main.tsx',
    staticPage: './src/ui/static/staticItemEntry.tsx',
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx'],
    fallback: { buffer: false },
  },
  output: {
    globalObject: 'self',
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build/browser'),
  },
  optimization: {
    usedExports: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.ui.json',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.ttf$/,
        use: ['file-loader'],
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      title: 'Kiwi',
      chunks: ['app'],
      meta: { viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no' },
    }),
    new MonacoWebpackPlugin(),
    new CompressionPlugin({
      test: /\.js$|\.css$|\.html$/,
      minRatio: 0.8,
    }),
    new LiveReloadWebpackPlugin({
      appendScript: true,
      ignore: ['node_modules/**'],
    }),
    // Enable this when analyzing bundle sizes, super time consuming.
    // new BundleAnalyzerPlugin({
    //   analyzerMode: 'disabled',
    //   generateStatsFile: true,
    //   statsOptions: {
    //     source: false
    //   }
    // })
  ],
}
