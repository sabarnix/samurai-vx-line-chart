module.exports = {
  "extends": "airbnb",
  "parser": "babel-eslint",
  "env": {
    "browser": true,
    "node": true,
    "jest": true,
    "es6": true
  },
  "plugins": [
    "react",
  ],
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "rules": {
    "arrow-parens": [
      "error",
      "always"
    ],
    "arrow-body-style": [
      2,
      "as-needed"
    ],
    "class-methods-use-this": 0,
    "comma-dangle": [
      2,
      "always-multiline"
    ],
    "import/imports-first": 0,
    "import/newline-after-import": 0,
    "import/no-dynamic-require": 0,
    "import/no-extraneous-dependencies": 0,
    "import/no-named-as-default": 0,
    "import/no-unresolved": 2,
    "import/no-webpack-loader-syntax": 0,
    "import/prefer-default-export": 0,
    "indent": [
      2,
      2,
      {
        "SwitchCase": 1
      }
    ],
    "max-len": 0,
    "newline-per-chained-call": 0,
    "no-confusing-arrow": 0,
    "no-console": 1,
    "no-use-before-define": 0,
    "prefer-template": 2,
    "react/forbid-prop-types": 0,
    "jsx-a11y/anchor-is-valid": 0,
    "jsx-a11y/label-has-for": 0,
    "jsx-a11y/no-noninteractive-element-interactions": 0,
    "jsx-a11y/click-events-have-key-events": 0,
    "jsx-a11y/no-static-element-interactions": 0,
    "jsx-a11y/no-autofocus": 0,
    "react/jsx-first-prop-new-line": [
      2,
      "multiline"
    ],
    "react/jsx-filename-extension": 0,
    "react/jsx-no-target-blank": 0,
    "react/require-default-props": 0,
    "react/require-extension": 0,
    "react/self-closing-comp": 0,
    "require-yield": 0,
    "jsx-a11y/href-no-hash": 0,
  },
  "settings": {
    "import/resolver": {
      "webpack": {
        "config": "./webpack.config.js"
      }
    }
  }
};
