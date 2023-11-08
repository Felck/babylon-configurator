module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": ["eslint:recommended", "plugin:jsdoc/recommended"],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "rules": {
        "semi": [1, "always"],
        "jsdoc/require-param-description": 0,
    },
    "globals": {
        "BABYLON": false
    },
    "plugins": [
        "jsdoc"
    ]
};
