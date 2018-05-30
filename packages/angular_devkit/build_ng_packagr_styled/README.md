# Angular Library Build Architect for ng-packagr with SASS/SCSS bundling

## How to use

1. Angular library generation

    Angular 6 defines projects in `angular.json` file. If you have already generated your lib, jump to step 3.
    
    `$ ng generate library my-new-library`
    
2. Change builder processor in `angular.json` file:

    Locate you library and change `builder`:
    
    ``` javascript 
        "my-new-library": {
              "root": "projects/my-new-library",
              "sourceRoot": "projects/my-new-library/src",
              "projectType": "library",
              "prefix": "smb",
              "architect": {
                "build": {
                  ----- "builder": "@angular-devkit/build-ng-packagr:build",
                  +++++ "builder": "@jogaram/build-ng-packagr-styled:build",
                  "options": {
                    "tsConfig": "projects/my-new-library/tsconfig.lib.json",
                    "project": "projects/my-new-library/ng-package.json"
                  },
                  "configurations": {
                    "production": {
                      "project": "projects/my-new-library/ng-package.prod.json"
                    }
                  }
                },
                "test": {
                  "builder": "@angular-devkit/build-angular:karma",
                  "options": {
                    "main": "projects/my-new-library/src/test.ts",
                    "tsConfig": "projects/my-new-library/tsconfig.spec.json",
                    "karmaConfig": "projects/my-new-library/karma.conf.js"
                  }
                },
                "lint": {
                  "builder": "@angular-devkit/build-angular:tslint",
                  "options": {
                    "tsConfig": [
                      "projects/my-new-library/tsconfig.lib.json",
                      "projects/my-new-library/tsconfig.spec.json"
                    ],
                    "exclude": [
                      "**/node_modules/**"
                    ]
                  }
                }
              }
            }
    ```
    
3. Define your library SASS/SCSS index file:

    ``` javascript 
            "my-new-library": {
                  "root": "projects/my-new-library",
                  "sourceRoot": "projects/my-new-library/src",
                  "projectType": "library",
                  "prefix": "smb",
                  "architect": {
                    "build": {
                      "builder": "@jogaram/build-ng-packagr-styled:build",
                      "options": {
                        "tsConfig": "projects/my-new-library/tsconfig.lib.json",
                        "project": "projects/my-new-library/ng-package.json"
                        +++++ "stylesIndex": "projects/my-new-library/src/index.scss"
                      },
                      "configurations": {
                        "production": {
                          "project": "projects/my-new-library/ng-package.prod.json"
                        }
                      }
                    },
                    "test": {
                      "builder": "@angular-devkit/build-angular:karma",
                      "options": {
                        "main": "projects/my-new-library/src/test.ts",
                        "tsConfig": "projects/my-new-library/tsconfig.spec.json",
                        "karmaConfig": "projects/my-new-library/karma.conf.js"
                      }
                    },
                    "lint": {
                      "builder": "@angular-devkit/build-angular:tslint",
                      "options": {
                        "tsConfig": [
                          "projects/my-new-library/tsconfig.lib.json",
                          "projects/my-new-library/tsconfig.spec.json"
                        ],
                        "exclude": [
                          "**/node_modules/**"
                        ]
                      }
                    }
                  }
                }
        ```
        
4. Build library

    `$ ng build my-new-library` or `$ ng build --prod my-new-library`
    
5. You are done!

    You should now see in dist generated package an `index.scss` or `index.sass` file with all your styles bundled.