const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  plugins:{
    
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(scss)$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('autoprefixer')
                ]
              }
            }
          },
          'sass-loader'
        ]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'static'), // Specify the output directory
    filename: 'bundle.js' // Specify the output filename
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'index.html'),
      templateParameters: {
        'PUBLIC_URL': process.env.PUBLIC_URL,
      },
      filename: path.resolve(__dirname, 'templates', 'index.html'),
    })
  ],
};
