const CopyWebpackPlugin = require("copy-webpack-plugin")

/** @type {import('next').NextConfig} */
const nextConfigX = {}
const nextConfig = {
    webpack: (config, options) => {
        config.plugins.push(new CopyWebpackPlugin({
            patterns: [
                {
                    from: "node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js",
                    to: "static/chunks/pages/[name][ext]",
                },
                {
                    from: "node_modules/@ricky0123/vad-web/dist/*.onnx",
                    to: "static/chunks/pages/[name][ext]",
                },
                { from: "node_modules/onnxruntime-web/dist/*.wasm", to: "static/chunks/pages/[name][ext]" },
            ]
        }))
        return config
    }
}

module.exports = nextConfig
