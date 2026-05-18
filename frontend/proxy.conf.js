const target = process.env.BACKEND_TARGET || "http://localhost:8080";

module.exports = {
  "/api": {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: "warn",
  },
};
