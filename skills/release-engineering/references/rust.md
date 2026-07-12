# Rust crates and GitHub release artifacts

Separate crates.io publication from application binary distribution. A library
crate needs package and API validation; a CLI release also needs a target
matrix, archive layout, checksums, and clean-install smoke tests.

## Crate preflight

- Confirm the package version, license expression or files, repository,
  documentation link, categories, keywords, `rust-version`, and feature
  defaults in `Cargo.toml`.
- Inspect workspace inheritance and path dependencies. Every published
  dependency must resolve from the registry at a compatible version.
- Run the repository's formatting, clippy, tests, documentation tests, and
  minimum-supported-Rust checks when configured.
- Review the public API and semver impact before choosing the version.

## Validate the crate package

```sh
cargo package --list
cargo package
cargo publish --dry-run
```

Inspect generated or bundled files and test from the packaged source when the
crate uses build scripts, generated code, native libraries, or feature-gated
modules. Do not assume workspace tests prove the packaged crate is complete.

## Binary and GitHub releases

- Define the supported target matrix explicitly. Do not silently omit a target
  that previous releases supported.
- Build from the release revision, archive a predictable top-level layout, and
  include license and concise installation material when established by the
  project.
- Generate checksums for the exact uploaded bytes. If installers or manifests
  embed checksums, validate the generated references before publishing.
- Test at least one clean install path per packaging family, such as a direct
  archive and the project's installer or package manager integration.
- Ensure release notes, tag, embedded version output, crate version, and
  artifact filenames all identify the same release.

## Publication behavior

- Registry publication is effectively immutable. A bad crate version can be
  yanked but not replaced.
- Create or push tags only when they point at the validated release revision.
  If CI is tag-driven, inspect the workflow and required secrets before pushing.
- Verify the crates.io record, GitHub release page, artifact downloads, and
  installed `--version` output after publication.
