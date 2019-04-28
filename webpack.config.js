module.exports = {
    entry: './app.js',

    output: {
        filename: "bundle.js",
        path: __dirname + '/dist/'
    },
    watch: true,
    stats: {
        warnings: false
    }
};
