/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Architect, TargetSpecifier } from '@angular-devkit/architect';
import { experimental, join, normalize } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { concatMap, tap } from 'rxjs/operators';


describe('NgPackagr Builder', () => {
  const workspaceFile = normalize('angular.json');
  const devkitRoot = normalize((global as any)._DevKitRoot); // tslint:disable-line:no-any
  const workspaceRoot = join(devkitRoot,
    'tests/@angular_devkit/build_ng_packagr/ng-packaged/');

  // TODO: move TestProjectHost from build-angular to architect, or somewhere else, where it
  // can be imported from.
  const host = new NodeJsSyncHost();
  const workspace = new experimental.workspace.Workspace(workspaceRoot, host);

  it('works', (done) => {
    const targetSpec: TargetSpecifier = { project: 'lib', target: 'build' };

    return workspace.loadWorkspaceFromHost(workspaceFile).pipe(
      concatMap(ws => new Architect(ws).loadArchitect()),
      concatMap(arch => arch.run(arch.getBuilderConfiguration(targetSpec))),
      tap((buildEvent) => expect(buildEvent.success).toBe(true)),
    ).toPromise().then(done, done.fail);
  }, 30000);

  it('tests works', (done) => {
    const targetSpec: TargetSpecifier = { project: 'lib', target: 'test' };

    return workspace.loadWorkspaceFromHost(workspaceFile).pipe(
      concatMap(ws => new Architect(ws).loadArchitect()),
      concatMap(arch => arch.run(arch.getBuilderConfiguration(targetSpec))),
      tap((buildEvent) => expect(buildEvent.success).toBe(true)),
    ).toPromise().then(done, done.fail);
  }, 45000);

  it('lint works', (done) => {
    const targetSpec: TargetSpecifier = { project: 'lib', target: 'lint' };

    return workspace.loadWorkspaceFromHost(workspaceFile).pipe(
      concatMap(ws => new Architect(ws).loadArchitect()),
      concatMap(arch => arch.run(arch.getBuilderConfiguration(targetSpec))),
      tap((buildEvent) => expect(buildEvent.success).toBe(true)),
    ).toPromise().then(done, done.fail);
  }, 30000);
});
