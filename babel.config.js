module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo'], 'nativewind/babel'],

    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],

          alias: {
            '@': './',
            'tailwind.config': './tailwind.config.js',
          },
        },
      ],
      'react-native-worklets/plugin',
      [
        "react-native-iconify/babel", {
          "icons": [
            "line-md:home",
            "ri:home-2-fill",
            "tabler:wallet",
            "tabler:credit-card",
            "fa-brands:cc-mastercard",
            "fa-brands:cc-visa",
            "tabler:transfer",
            "tabler:building-bank",
            "mdi:graph-bar",
          ]
        }
      ]
    ],
  };
};
