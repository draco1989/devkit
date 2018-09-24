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
import { copyFile, writeFile } from 'fs';
import * as glob from 'glob';
import * as mkdirp from 'mkdirp';
import { flattenDeep } from 'lodash';

// TODO move this function to architect or somewhere else where it can be imported from.
// Blatantly copy-pasted from 'require-project-module.ts'.
function requireProjectModule(root: string, moduleName: string) {
  return require(require.resolve(moduleName, {paths: [root]}));
}

function promisify<T extends Function>(fn: T) {
  return (...args: any[]): Promise<void> =>
    new Promise((resolve, reject) =>
      fn(...args, (err: string | Error) =>
        err ? reject(err) : resolve()));
}

export interface NgPackagrBuilderOptions {
  project: string;
  stylesIndex: string;
  tsConfig?: string;
  include?: string[];
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
          if (options.include) {
            return this.includeFiles(
              root.toString(),
              destPath,
              builderConfig.sourceRoot,
              builderConfig.options.include);
          }
        })
        .then(() => {
          obs.next({success: true});
          obs.complete();
        })
        .catch((e) => obs.error(e));
    });
  }

  private includeFiles(root: string, destRoot: string, sourceRoot?: string,
                       includes: string[] = []): Promise<void> {
    this.context.logger.info(`Bundling included file paths...`);

    return Promise
      .all(includes.map(pathGlob =>
        new Promise((resolve, reject) =>
          glob(path.resolve(root, path.normalize(pathGlob)),
            (err, files) => err ? reject(err) : resolve(files)))))
      .then(pathMatrix => flattenDeep(pathMatrix) as string[])
      .then(files =>
        Promise.all(files.map(file =>
          this.bundleFile(root, file, destRoot, sourceRoot))))
      .then(() => this.context.logger.info(`Files bundling succeeded!`));
  }

  private bundleFile(root: string, file: string, destRoot: string, sourceRoot?: string) {
    const src = path.resolve(root, path.normalize(file)),
      dest = path.join(destRoot, path.relative(sourceRoot || root, src));

    this.context.logger.info(`Copy: "${src}" --> "${dest}"`);

    return promisify(mkdirp)(path.dirname(dest))
      .then(() => promisify(copyFile)(src, dest));
  }

  private mergeStyles(root: string, index: string, destRoot: string): Promise<void> {
    const src = path.resolve(root, path.normalize(index));
    const dest = path.join(destRoot, `index${path.extname(index)}`);

    this.context.logger.info(`Bundling SASS/SCSS styles from "${src}" to "${dest}"`);

    return new Bundler().Bundle(src)
      .then(result => {
        if (result.found && 'string' === typeof result.bundledContent) {
          return promisify(writeFile)(
            dest, result.bundledContent, {encoding: 'utf8'}) as Promise<void>;
        } else {
          return Promise.reject(`Could not find SASS/SCSS index file at "${src}"`);
        }
      })
      .then(() => this.context.logger.info(`SASS/SCSS styles bundling succeeded!`));
  }
}

export default NgPackagrBuilder;
