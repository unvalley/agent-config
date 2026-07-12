# macOS and App Store releases

Choose the distribution path before changing build settings. Mac App Store and
Developer ID distribution share artifact checks but have different signing,
entitlement, upload, and review paths. Re-check current Apple requirements and
the repository's existing automation before using any command here.

## Common preflight

- Confirm the bundle identifier, marketing version, build number, minimum OS,
  executable name, and product name across build settings and `Info.plist`.
- Verify icons, localized metadata, copyright, category, support URL, privacy
  URL, and review notes. Leave unknown contact details as explicit blockers;
  never invent them.
- Audit bundled resources and privacy declarations. Ensure the privacy manifest
  matches the APIs and data behavior in the shipped binary.
- Exercise release-only code paths. Debug builds often bypass sandbox,
  licensing, signing, or hardened-runtime behavior.
- Use public platform APIs. A private API working locally does not make an App
  Store artifact acceptable.

## Mac App Store path

- Enable App Sandbox and grant only required entitlements. Confirm file access,
  network access, automation, and security-scoped resource behavior from the
  sandboxed build.
- Match the App Store Connect application record, distribution certificate,
  and provisioning profile to the final bundle identifier and team.
- Build the final archive or installer through the repository's release script.
  Validate the resulting signature and package, not only the `.app` directory.
- Upload with the configured Apple tooling, then distinguish upload acceptance
  from processing completion, TestFlight or review readiness, and approval.
- Smoke-test the processed build when a test channel is available. Use fresh
  preferences and an empty sandbox container to expose hidden local state.

## Developer ID path

- Enable the hardened runtime and sign nested code in dependency order with the
  intended Developer ID identity.
- Submit the exact distributed archive for notarization, wait for a successful
  result, and staple the ticket where the artifact format supports it.
- Verify Gatekeeper behavior on a clean machine or account after downloading
  through the real distribution channel.

## Useful artifact checks

Select checks appropriate to the artifact and existing build system:

```sh
plutil -lint path/to/Info.plist path/to/PrivacyInfo.xcprivacy
codesign --verify --deep --strict --verbose=2 path/to/App.app
codesign -d --entitlements :- path/to/App.app
spctl --assess --type execute --verbose=2 path/to/App.app
pkgutil --check-signature path/to/App.pkg
lipo -info path/to/App.app/Contents/MacOS/App
```

Do not treat `--deep` as a substitute for correct nested-code signing. Use it as
an inspection check after the build system has signed the graph deliberately.

## Report separately

- local release build
- sandbox runtime smoke
- signature and entitlement inspection
- package creation
- upload and processing
- store review or approval
- install of the processed or published artifact
