module.exports = {
    "testEnvironment": "node",
    "moduleFileExtensions": [
        "ts",
        "js",
        "json",
        "node"
    ],
    "coverageDirectory": "./coverage",
    "collectCoverageFrom": [
        "src/**/*.{ts,js}",
        "!src/**/*.d.ts"
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": ["ts-jest", {
            "useBabelrc": false,
            "diagnostics": false
        }]
    },
    "reporters": [
        "default",
        ["./node_modules/jest-html-reporter", {
            "pageTitle": "Test Report",
            "outputPath": "./coverage/testreport.html",
            "sort": "titleAsc"
        }]
    ],
    "globalSetup": '<rootDir>/setTestEnvVariables.ts'
}


// "setupFiles": ["./setupBeforeEnv.ts"],
    // "setupFilesAfterEnv": ["./setupAfterEnv.ts"],
    //    "preset": "jest-dynalite",
            //
    //"setupFiles": ["<rootDir>/setTestEnvVariables.ts"],
    
