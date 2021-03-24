module.exports = {
  name: '@yarnpkg/plugin-snuggery-workspace',
  factory: require => {
    const {BaseCommand, WorkspaceRequiredError} = require("@yarnpkg/cli");
    const {Configuration, FormatType, formatUtils, Manifest, MessageName, miscUtils, Project, StreamReport, structUtils, tgzUtils} = require("@yarnpkg/core");
    const {ppath, xfs, CwdFS} = require("@yarnpkg/fslib");
    const {npmConfigUtils, npmHttpUtils, npmPublishUtils} = require('@yarnpkg/plugin-npm');
    const {packUtils} = require("@yarnpkg/plugin-pack");
    const {UsageError} = require("clipanion");

    class PackCommand extends BaseCommand {
      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const {project, workspace} = await Project.find(configuration, this.context.cwd);

        if (!workspace) throw new WorkspaceRequiredError(project.cwd, this.context.cwd);

        if (workspace.manifest.name == null) {
          throw new UsageError(`Package at ${workspace.relativeCwd} doesn't have a name`);
        }

        if (!ppath.normalize(workspace.relativeCwd).startsWith('packages/')) {
          throw new UsageError(`Package at ${workspace.relativeCwd} is not in the packages/ folder`);
        }

        const dist = ppath.join(project.cwd, 'dist');
        await xfs.mkdirPromise(dist, {recursive: true});

        await project.restoreInstallState();

        const target = ppath.join(dist,  `${structUtils.slugifyIdent(workspace.manifest.name)}.tgz`);
        const source = ppath.join(workspace.cwd, 'dist');

        if (!(await xfs.existsPromise(source))) {
          throw new UsageError(`Build package ${structUtils.prettyIdent(configuration, workspace.manifest.name)} first`);
        }

        const rawManifest = (await xfs.readJsonPromise(
          ppath.join(source, 'package.json'),
        ));
        const ident = structUtils.parseIdent(rawManifest.name);

        if (ident.identHash !== workspace.anchoredDescriptor.identHash) {
          throw new UsageError(
            `Invalid distribution folder: found package ${structUtils.prettyIdent(
              configuration,
              ident,
            )} but expected ${structUtils.prettyIdent(configuration, workspace.anchoredDescriptor)}`,
          );
        }

        const report = await StreamReport.start(
          {
            configuration,
            stdout: this.context.stdout,
            includeFooter: false,
          },
          async report => {
            const publishWorkspace = createPublishWorkspace(workspace, source, rawManifest);

            await packUtils.prepareForPack(publishWorkspace, {report}, async () => {
              const files = await packUtils.genPackList(publishWorkspace);

              report.reportInfo(
                MessageName.UNNAMED,
                `Packing ${structUtils.prettyIdent(configuration, ident)}`,
              );

              const pack = await packUtils.genPackStream(publishWorkspace, files);

              await xfs.writeFilePromise(target, await miscUtils.bufferStream(pack));
            });

            if (!report.hasErrors()) {
              report.reportInfo(
                MessageName.UNNAMED,
                `Package archive stored at ${formatUtils.pretty(
                  configuration,
                  target,
                  FormatType.PATH,
                )}`,
              );
            }
          },
        );

        return report.exitCode();
      }
    }
    PackCommand.addPath('snuggery-workspace', 'pack');

    class PublishCommand extends BaseCommand {
      tag = 'latest';

      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const {project, workspace} = await Project.find(configuration, this.context.cwd);

        if (!workspace) throw new WorkspaceRequiredError(project.cwd, this.context.cwd);

        if (workspace.manifest.name === null || workspace.manifest.version === null) {
          throw new UsageError(
            'Workspaces must have valid names and versions to be published on an external registry',
          );
        }

        const ident = workspace.manifest.name;

        const tgz = ppath.join(project.cwd, 'dist', `${structUtils.slugifyIdent(ident)}.tgz`);

        if (!(await xfs.existsPromise(tgz))) {
          throw new UsageError(`Pack package ${structUtils.prettyIdent(configuration, ident)} first`);
        }

        await project.restoreInstallState();

        const tarballBuffer = await xfs.readFilePromise(tgz);
        const manifest = await getManifestFromTarball(tarballBuffer);

        if (manifest.name == null || manifest.name.identHash !== ident.identHash) {
          throw new UsageError(`Tarball for package ${manifest.name && structUtils.prettyIdent(configuration, manifest.name)} cannot be published in workspace for ${structUtils.prettyIdent(configuration, ident)}`);
        }

        const registry = npmConfigUtils.getPublishRegistry(manifest, {configuration});

        const report = await StreamReport.start(
          {
            configuration,
            stdout: this.context.stdout,
          },
          async report => {
            const body = await npmPublishUtils.makePublishBody(createPublishWorkspace(workspace, workspace.cwd, manifest.raw), tarballBuffer, {
              tag: this.tag,
              registry,
            });

            try {
              await npmHttpUtils.put(npmHttpUtils.getIdentUrl(ident), body, {
                configuration,
                registry,
                ident,
                jsonResponse: true,
              });
            } catch (error) {
              if (error.name !== 'HTTPError') {
                throw error;
              } else {
                const message =
                  error.response.body && error.response.body.error
                    ? error.response.body.error
                    : `The remote server answered with HTTP ${error.response.statusCode} ${error.response.statusMessage}`;

                report.reportError(MessageName.NETWORK_ERROR, message);
              }
            }

            if (!report.hasErrors()) {
              report.reportInfo(MessageName.UNNAMED, 'Package archive published');
            }
          },
        );

        return report.exitCode();
      }
    }
    PublishCommand.addPath('snuggery-workspace', 'publish');
    PublishCommand.addOption('tag', PublishCommand.String(`--tag`));

    function createPublishWorkspace(
      workspace,
      cwd,
      rawManifest,
    ) {
      return Object.create(workspace, {
        cwd: {
          value: cwd,
          writable: false,
          configurable: true,
        },
    
        manifest: {
          value: Manifest.fromText(JSON.stringify(rawManifest)),
          writable: false,
          configurable: true,
        },
      });
    }

    function getManifestFromTarball(buffer) {
      return xfs.mktempPromise(async folder => {
        const fs = new CwdFS(folder);
        await tgzUtils.extractArchiveTo(buffer, fs, {stripComponents: 1});
    
        return Manifest.fromText(await fs.readFilePromise(Manifest.fileName, 'utf8'));
      });
    }

    return {
      commands: [PackCommand, PublishCommand],
    };
  },
};
