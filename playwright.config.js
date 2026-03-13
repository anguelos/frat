const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './test/js',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8181',
  },
  webServer: [
    {
      command: 'python test/js/start_test_server.py',
      url: 'http://localhost:8181',
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
      cwd: path.resolve(__dirname),
    },
    {
      command: 'python test/js/start_view_only_server.py',
      url: 'http://localhost:8182',
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
      cwd: path.resolve(__dirname),
    },
  ],
});
