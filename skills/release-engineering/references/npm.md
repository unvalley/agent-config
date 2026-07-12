# npm releases

Inspect the repository's package manager, workspace layout, and publication
workflow before changing package metadata. Re-check current npm authentication
and provenance requirements rather than copying an old release command.

## Package preflight

- Confirm `name`, `version`, `license`, `engines`, repository links, entry
  points, `exports`, `types`, `bin`, and the public/private setting.
- Check the actual packed file list. Exclude tests, secrets, local config, and
  oversized build inputs; include generated runtime files, type declarations,
  license text, and required assets.
- Run the repository's lint, typecheck, tests, and build with the lockfile held
  constant. Test both ESM and CommonJS consumers when the package claims both.
- Audit lifecycle scripts. A `prepublishOnly`, `prepare`, or postinstall script
  can make the published artifact differ from the reviewed source.

## Validate the tarball

```sh
npm pack --dry-run
npm pack
tar -tf package-name-version.tgz
```

Install the tarball into a temporary consumer project and import or execute the
public entry point. Do this before registry publication.

## Publish and verify

- Prefer the repository's CI release workflow when it already provides trusted
  publishing or provenance. Keep registry tokens out of local logs and files.
- Use provenance only when the configured CI identity and registry support it;
  verify the resulting registry metadata instead of assuming a flag succeeded.
- Confirm dist-tag intent. `latest`, prerelease tags, and canary channels are
  product decisions, not interchangeable command options.
- After publication, query the exact version and install it into a clean
  consumer. Verify entry points, CLI shims, and type declarations.
- Published versions are immutable. If the artifact is wrong, deprecate it or
  release a corrected version instead of trying to overwrite it.
