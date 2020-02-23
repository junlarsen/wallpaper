const copy = require('copy-webpack-plugin')

module.exports = {
  entry: './src/index.ts',

  output: {
    filename: 'bundle.js',
    path: __dirname + '/dist/'
  },
  plugins: [
    new copy([
      { from: 'src', to: '.', ignore: ['*.ts'] },
      { from: 'assets', to: 'assets' }
    ])
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  watch: true,
  stats: {
    warnings: false
  }
}
