module.exports = function (api) {
  api.cache(true);
  // react-native-worklets/plugin es el plugin de Reanimated 4 (debe estar para release)
  const plugins = ["react-native-worklets/plugin"];

  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins,
  };
};
