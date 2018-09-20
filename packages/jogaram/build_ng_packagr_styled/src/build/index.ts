/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Builder,
  BuilderConfiguration,
  BuilderContext,
  BuildEvent
} from '@angular-devkit/architect';
import { getSystemPath, normalize, resolve } from '@angular-devkit/core';
import * as ngPackagr from 'ng-packagr';
import { Observable } from 'rxjs';
import * as path from 'path';
import { Bundler } from 'scss-bundle';
import { writeFile } from 'fs';

// TODO move this function to architect or somewhere else where it can be imported from.
// Blatantly copy-pasted from 'require-project-module.ts'.
function requireProjectModule(root: string, moduleName: string) {
  return require(require.resolve(moduleName, {paths: [root]}));
}

export interface NgPackagrBuilderOptions {
  project: string;
  tsConfig?: string;
  stylesIndex?: string;
}

export class NgPackagrBuilder implements Builder<NgPackagrBuilderOptions> {

  constructor(public context: BuilderContext) {
  }

  run(builderConfig: BuilderConfiguration<NgPackagrBuilderOptions>): Observable<BuildEvent> {
    const root = this.context.workspace.root;
    const options = builderConfig.options;

    if (!options.project) {
      throw new Error('A "project" must be specified to build a library\'s npm package.');
    }

    return new Observable(obs => {
      const projectNgPackagr = requireProjectModule(
        getSystemPath(root), 'ng-packagr') as typeof ngPackagr;
      const packageJsonPath = getSystemPath(resolve(root, normalize(options.project)));
      const destPath = path.resolve(path.dirname(packageJsonPath), require(packageJsonPath).dest);

      const ngPkgProject = projectNgPackagr.ngPackagr()
        .forProject(packageJsonPath);

      if (options.tsConfig) {
        const tsConfigPath = getSystemPath(resolve(root, normalize(options.tsConfig)));
        ngPkgProject.withTsConfig(tsConfigPath);
      }

      ngPkgProject.build()
        .then(() => {
          if (options.stylesIndex) {
            return this.mergeStyles(root.toString(),
              builderConfig.options.stylesIndex as string, destPath);
          }
        })
        .then(() => {
          obs.next({success: true});
          obs.complete();
        })
        .catch((e) => obs.error(e));
    });
  }

  mergeStyles(root: string, index: string, destRoot: string): Promise<void> {
    const src = path.resolve(root, path.normalize(index));
    const dest = path.join(destRoot, `index${path.extname(index)}`);

    this.context.logger.info(`Bundling SASS/SCSS styles from "${src}" to "${dest}"`);

    return new Bundler().Bundle(src)
      .then(result => {
        if (result.found && 'string' === typeof result.bundledContent) {
          return this.saveBundledSass(result.bundledContent, dest);
        } else {
          return Promise.reject(`Could not find SASS/SCSS index file at "${src}"`);
        }
      })
      .then(() => this.context.logger.info(`SASS/SCSS styles bundling succeeded!`));
  }

  saveBundledSass(content: string, file: string): Promise<void> {
    return new Promise(((resolve, reject) =>
      writeFile(file, content, {encoding: 'utf8'}, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })));
  }

}

export default NgPackagrBuilder;
