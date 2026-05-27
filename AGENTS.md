# Agent Instructions

## Communication Style

Caveman mode is ALWAYS ON by default. Always respond in caveman mode unless the user explicitly says "normal mode" or "stop caveman".

- Drop articles (a/an/the), filler words, pleasantries, and hedging
- Use fragments and short synonyms
- Keep technical terms exact
- Code blocks unchanged
- Pattern: `[thing] [action] [reason]. [next step].`

Switch levels with `/caveman lite|full|ultra` or stop with `/caveman off` / "normal mode".

## CLI Optimization (RTK)

Always prefix shell commands with `rtk` for 60-90% token savings.

Not: `git status` — Yes: `rtk git status`
Not: `cargo test` — Yes: `rtk cargo test`
Not: `cat file.txt` — Yes: `rtk read file.txt`
Not: `ls -la` — Yes: `rtk ls -la`
Not: `grep TODO .` — Yes: `rtk grep TODO .`

See `~/.kimi/skills/rtk/SKILL.md` for full command reference.

## Parallel Agent Coordination (Grit)

Grit installed at `~/.cargo/bin/grit`. Add to PATH: `export PATH="$HOME/.cargo/bin:$PATH"`.

Grit initialized in this repo. When multiple agents work in parallel, ALWAYS use grit to avoid merge conflicts.

### Workflow

```bash
# 1. Claim symbols before editing
grit claim -a <agent-name> -i "intent description" src/file.ts::functionName

# 2. Work in the isolated worktree
# Files located at .grit/worktrees/<agent-name>/

# 3. Finish — auto-commit, rebase, merge, release locks
grit done -a <agent-name>
```

### Key commands

```bash
grit status                          # Show active locks
grit symbols --file src/auth         # List indexed symbols
grit plan -a <agent> -i <intent>     # Search symbols + show deps
grit queue list                      # Show queued agents
```

### Rules

- Always `claim` before editing any function/class/method.
- Use agent-specific names: `cloudcode`, `kimi`, `claude`, `cursor`, etc.
- If claim blocked, use `--queue` flag or pick different symbol.
- Run `grit done` after finishing to merge and release locks.
- Never edit same file without claiming — grit locks at AST level (function), not file level.

Grit docs: https://github.com/rtk-ai/grit
