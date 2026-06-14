//! Installs this repository's agent assets into local AI agent directories.
//!
//! Skills, subagents, and slash commands are symlinked into the target agent's
//! config directory, so edits in this repo are picked up live. Use `--copy` to
//! copy instead. The repository path is baked in at build time, so the command
//! works from any working directory.

use std::collections::BTreeSet;
use std::env;
use std::fs;
use std::os::unix::fs as unixfs;
use std::path::{Path, PathBuf};
use std::process::ExitCode;
use std::str::FromStr;

use bpaf::{Bpaf, Parser};

/// Repository root, resolved at compile time.
const REPO_ROOT: &str = env!("CARGO_MANIFEST_DIR");

#[derive(Bpaf, Clone, Debug)]
#[bpaf(options, version)]
/// Install this repo's skills, agents, and commands into local AI agent dirs.
enum Cli {
    /// Link (or copy) assets into the target agent directories
    #[bpaf(command)]
    Install {
        #[bpaf(external(target))]
        target: TargetArg,
        /// Copy files instead of symlinking
        #[bpaf(long)]
        copy: bool,
        /// Replace existing entries not managed by this repo
        #[bpaf(long)]
        force: bool,
        /// Print actions without changing anything
        #[bpaf(long)]
        dry_run: bool,
    },

    /// Remove assets previously installed from this repo
    #[bpaf(command)]
    Uninstall {
        #[bpaf(external(target))]
        target: TargetArg,
        /// Also remove entries not managed by this repo
        #[bpaf(long)]
        force: bool,
        /// Print actions without changing anything
        #[bpaf(long)]
        dry_run: bool,
    },

    /// Show which assets are installed where
    #[bpaf(command)]
    Status {
        #[bpaf(external(target))]
        target: TargetArg,
    },
}

/// `-t/--target claude|codex|all` (defaults to claude).
fn target() -> impl Parser<TargetArg> {
    bpaf::short('t')
        .long("target")
        .help("Target agent(s): claude, codex, or all [default: claude]")
        .argument::<TargetArg>("AGENT")
        .fallback(TargetArg::Claude)
}

#[derive(Clone, Copy, Debug)]
enum TargetArg {
    Claude,
    Codex,
    All,
}

impl TargetArg {
    fn targets(self) -> Vec<Target> {
        match self {
            TargetArg::Claude => vec![Target::Claude],
            TargetArg::Codex => vec![Target::Codex],
            TargetArg::All => vec![Target::Claude, Target::Codex],
        }
    }
}

impl FromStr for TargetArg {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "claude" => Ok(TargetArg::Claude),
            "codex" => Ok(TargetArg::Codex),
            "all" => Ok(TargetArg::All),
            other => Err(format!("invalid target '{other}' (claude|codex|all)")),
        }
    }
}

#[derive(Clone, Copy)]
enum Target {
    Claude,
    Codex,
}

impl Target {
    /// Config directory under $HOME for this agent.
    fn base_dir(self, home: &Path) -> PathBuf {
        match self {
            Target::Claude => home.join(".claude"),
            Target::Codex => home.join(".codex"),
        }
    }

    /// Asset kinds this agent understands.
    fn kinds(self) -> &'static [AssetKind] {
        match self {
            // Claude Code reads skills, subagents, and slash commands.
            Target::Claude => &[AssetKind::Skills, AssetKind::Agents, AssetKind::Commands],
            // Codex consumes skills; AGENTS.md is read natively from the repo.
            Target::Codex => &[AssetKind::Skills],
        }
    }

    fn label(self) -> &'static str {
        match self {
            Target::Claude => "claude",
            Target::Codex => "codex",
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum AssetKind {
    Skills,
    Agents,
    Commands,
}

impl AssetKind {
    /// Directory name, identical under the repo root and the agent config dir.
    fn dir(self) -> &'static str {
        match self {
            AssetKind::Skills => "skills",
            AssetKind::Agents => "agents",
            AssetKind::Commands => "commands",
        }
    }

    /// A skill is a directory containing SKILL.md; agents/commands are .md files.
    fn matches(self, path: &Path) -> bool {
        match self {
            AssetKind::Skills => path.is_dir() && path.join("SKILL.md").is_file(),
            AssetKind::Agents | AssetKind::Commands => {
                path.is_file() && path.extension().and_then(|e| e.to_str()) == Some("md")
            }
        }
    }
}

/// Items of `kind` found under the repo root. Empty if the source dir is absent.
fn discover(kind: AssetKind) -> Result<Vec<(String, PathBuf)>, String> {
    let root = Path::new(REPO_ROOT).join(kind.dir());
    let mut out = Vec::new();
    let rd = match fs::read_dir(&root) {
        Ok(rd) => rd,
        Err(_) => return Ok(out),
    };
    for entry in rd {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if kind.matches(&path) {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                out.push((name.to_string(), path));
            }
        }
    }
    out.sort_by(|a, b| a.0.cmp(&b.0));
    Ok(out)
}

fn home_dir() -> Result<PathBuf, String> {
    env::var_os("HOME")
        .map(PathBuf::from)
        .ok_or_else(|| "HOME is not set".to_string())
}

/// True if `link` is a symlink whose target is inside this repo.
fn is_managed_symlink(link: &Path) -> bool {
    fs::read_link(link)
        .map(|t| t.starts_with(REPO_ROOT))
        .unwrap_or(false)
}

fn copy_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    if src.is_dir() {
        fs::create_dir_all(dst)?;
        for entry in fs::read_dir(src)? {
            let entry = entry?;
            copy_recursive(&entry.path(), &dst.join(entry.file_name()))?;
        }
    } else {
        if let Some(parent) = dst.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::copy(src, dst)?;
    }
    Ok(())
}

fn install(target: TargetArg, copy: bool, force: bool, dry_run: bool) -> Result<(), String> {
    let home = home_dir()?;
    let mut total = 0usize;

    for target in target.targets() {
        for &kind in target.kinds() {
            let items = discover(kind)?;
            if items.is_empty() {
                continue;
            }
            let dir = target.base_dir(&home).join(kind.dir());
            println!("\n[{}] {} -> {}", target.label(), kind.dir(), dir.display());
            if !dry_run {
                fs::create_dir_all(&dir).map_err(|e| format!("mkdir {}: {e}", dir.display()))?;
            }

            for (name, src) in &items {
                let dst = dir.join(name);

                if dst.symlink_metadata().is_ok() {
                    if !is_managed_symlink(&dst) && !force {
                        println!("  skip  {name} (exists, not managed; use --force)");
                        continue;
                    }
                    if dry_run {
                        println!("  replace {name}");
                    } else {
                        remove_path(&dst)?;
                    }
                }

                if dry_run {
                    println!("  {}  {name}", if copy { "copy" } else { "link" });
                    total += 1;
                    continue;
                }

                if copy {
                    copy_recursive(src, &dst).map_err(|e| format!("copy {name}: {e}"))?;
                    println!("  copied {name}");
                } else {
                    let abs = fs::canonicalize(src).map_err(|e| format!("resolve {name}: {e}"))?;
                    unixfs::symlink(&abs, &dst).map_err(|e| format!("link {name}: {e}"))?;
                    println!("  linked {name}");
                }
                total += 1;
            }
        }
    }

    if total == 0 {
        return Err("no assets found to install".into());
    }
    if dry_run {
        println!("\n(dry run - nothing changed)");
    }
    Ok(())
}

fn uninstall(target: TargetArg, force: bool, dry_run: bool) -> Result<(), String> {
    let home = home_dir()?;

    for target in target.targets() {
        for &kind in target.kinds() {
            let names: BTreeSet<String> = discover(kind)?.into_iter().map(|(n, _)| n).collect();
            if names.is_empty() {
                continue;
            }
            let dir = target.base_dir(&home).join(kind.dir());
            println!("\n[{}] {} {}", target.label(), kind.dir(), dir.display());
            for name in &names {
                let dst = dir.join(name);
                if dst.symlink_metadata().is_err() {
                    continue;
                }
                if !is_managed_symlink(&dst) && !force {
                    println!("  keep   {name} (copied or not managed; use --force)");
                    continue;
                }
                if dry_run {
                    println!("  remove {name}");
                } else {
                    remove_path(&dst)?;
                    println!("  removed {name}");
                }
            }
        }
    }
    if dry_run {
        println!("\n(dry run - nothing changed)");
    }
    Ok(())
}

fn status(target: TargetArg) -> Result<(), String> {
    let home = home_dir()?;
    println!("repo: {REPO_ROOT}");
    for target in target.targets() {
        for &kind in target.kinds() {
            let items = discover(kind)?;
            if items.is_empty() {
                continue;
            }
            let dir = target.base_dir(&home).join(kind.dir());
            println!("\n[{}] {} {}", target.label(), kind.dir(), dir.display());
            for (name, _) in &items {
                let dst = dir.join(name);
                let state = match dst.symlink_metadata() {
                    Err(_) => "missing",
                    Ok(_) if is_managed_symlink(&dst) => "linked (this repo)",
                    Ok(m) if m.file_type().is_symlink() => "linked (elsewhere)",
                    Ok(_) => "present (copy/other)",
                };
                println!("  {name:<22} {state}");
            }
        }
    }
    Ok(())
}

fn remove_path(p: &Path) -> Result<(), String> {
    let meta = p
        .symlink_metadata()
        .map_err(|e| format!("stat {}: {e}", p.display()))?;
    let res = if meta.file_type().is_symlink() || meta.is_file() {
        fs::remove_file(p)
    } else {
        fs::remove_dir_all(p)
    };
    res.map_err(|e| format!("remove {}: {e}", p.display()))
}

fn main() -> ExitCode {
    let result = match cli().run() {
        Cli::Install {
            target,
            copy,
            force,
            dry_run,
        } => install(target, copy, force, dry_run),
        Cli::Uninstall {
            target,
            force,
            dry_run,
        } => uninstall(target, force, dry_run),
        Cli::Status { target } => status(target),
    };

    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("error: {e}");
            ExitCode::FAILURE
        }
    }
}
