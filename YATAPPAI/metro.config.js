const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Use single worker to avoid "jest worker terminated" (SIGTERM) errors on Windows
config.maxWorkers = 1;

module.exports = config;
