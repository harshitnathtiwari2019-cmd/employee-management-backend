module.exports = {
  testEnvironment: "node",

  testMatch: ["<rootDir>/tests/**/*.test.ts"],

  transform: {
    "^.+\\.tsx?$": [
      "babel-jest",
      {
        plugins: [
          ["@babel/plugin-transform-typescript", { allowDeclareFields: true }],
          ["@babel/plugin-proposal-decorators", { version: "legacy" }],
        ],
        presets: [
          [
            "@babel/preset-env",
            {
              targets: { node: "current" },
              modules: "commonjs",
            },
          ],
        ],
      },
    ],
  },

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^file-type$": "<rootDir>/tests/mocks/file-type.ts",
  },

  clearMocks: true,
};
