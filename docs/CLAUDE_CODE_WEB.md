# Claude Code on the web — reference

Snapshot from Anthropic's Claude Code documentation (the cloud-session feature
at claude.ai/code). Captured 2026-05-04. The canonical source is the live docs
index at https://code.claude.com/docs/llms.txt — re-fetch if anything here
appears stale.

This page is a reference for any agent that may run in (or hand a task to) a
Claude Code on the web cloud session. Most TheTemple development is local, but
this doc covers the cloud-session model that other Anthropic agents and the
ultraplan / ultrareview / Auto-fix flows depend on.

Topics:
- GitHub authentication options
- The cloud environment (what carries over, what's installed, how to configure)
- Setup scripts and dependency management
- Network access (levels, proxies, default allowlist)
- Moving tasks between web and terminal (`--remote` and `--teleport`)
- Working with sessions
- Auto-fix pull requests
- Security and isolation
- Limitations

Claude Code on the web is in research preview for Pro, Max, and Team users,
and for Enterprise users with premium seats or Chat + Claude Code seats.
Sessions persist even if the browser closes; the Claude mobile app can monitor
them.

## GitHub authentication options

Cloud sessions need access to your GitHub repositories to clone code and push
branches. Two ways to grant access:

| Method | How it works | Best for |
|---|---|---|
| GitHub App | Install the Claude GitHub App on specific repositories during web onboarding. Access is scoped per repository. | Teams that want explicit per-repo authorization |
| `/web-setup` | Run `/web-setup` in your terminal to sync your local `gh` CLI token to your Claude account. Access matches whatever your `gh` token can see. | Individual developers who already use `gh` |

Either method works. `/schedule` checks for either form of access and prompts
you to run `/web-setup` if neither is configured.

The GitHub App is required for Auto-fix, which uses the App to receive PR
webhooks. If you connect with `/web-setup` and later want Auto-fix, install the
App on those repositories.

Team and Enterprise admins can disable `/web-setup` with the **Quick web setup**
toggle at `claude.ai/admin-settings/claude-code`.

Organizations with Zero Data Retention enabled cannot use `/web-setup` or other
cloud session features.

## The cloud environment

Each session runs in a fresh Anthropic-managed VM with the repository cloned.

### What's available

| Available in cloud sessions | Why |
|---|---|
| Repo's `CLAUDE.md` | Yes — part of the clone |
| Repo's `.claude/settings.json` hooks | Yes — part of the clone |
| Repo's `.mcp.json` MCP servers | Yes — part of the clone |
| Repo's `.claude/rules/` | Yes — part of the clone |
| Repo's `.claude/skills/`, `.claude/agents/`, `.claude/commands/` | Yes — part of the clone |
| Plugins declared in `.claude/settings.json` | Yes — installed at session start from the marketplace you declared. Requires network access to reach the marketplace source |
| User `~/.claude/CLAUDE.md` | No — lives on your machine, not in the repo |
| Plugins enabled only in user settings | No — user-scoped `enabledPlugins` lives in `~/.claude/settings.json`. Declare them in repo `.claude/settings.json` instead |
| MCP servers added with `claude mcp add` | No — those write to local user config. Declare in `.mcp.json` instead |
| Static API tokens and credentials | No — no dedicated secrets store yet |
| Interactive auth like AWS SSO | No — SSO requires browser-based login that can't run in a cloud session |

To make configuration available in cloud sessions, commit it to the repo. There
is no dedicated secrets store. Both environment variables and setup scripts
are stored in the environment configuration, visible to anyone who can edit
that environment.

### Installed tools

| Category | Included |
|---|---|
| Python | Python 3.x with pip, poetry, uv, black, mypy, pytest, ruff |
| Node.js | 20, 21, and 22 via nvm; npm, yarn, pnpm, bun¹, eslint, prettier, chromedriver |
| Ruby | 3.1, 3.2, 3.3 with gem, bundler, rbenv |
| PHP | 8.4 with Composer |
| Java | OpenJDK 21 with Maven and Gradle |
| Go | latest stable with module support |
| Rust | rustc and cargo |
| C/C++ | GCC, Clang, cmake, ninja, conan |
| Docker | docker, dockerd, docker compose |
| Databases | PostgreSQL 16, Redis 7.0 |
| Utilities | git, jq, yq, ripgrep, tmux, vim, nano |

¹ Bun is installed but has known proxy compatibility issues for package fetching.

For exact versions, run `check-tools` in a cloud session (cloud-only command).

### Work with GitHub issues and pull requests

Cloud sessions include built-in GitHub tools that read issues, list pull
requests, fetch diffs, and post comments without setup. They authenticate
through the GitHub proxy using whichever method is configured under GitHub
authentication options, so the token never enters the container.

The `gh` CLI is **not** pre-installed. To use commands the built-in tools don't
cover (`gh release`, `gh workflow run`, etc.):

1. **Install `gh` in the setup script** — add `apt update && apt install -y gh`.
2. **Provide a token** — add a `GH_TOKEN` environment variable to the
   environment settings with a GitHub personal access token. `gh` reads
   `GH_TOKEN` automatically; no `gh auth login` step is needed.

### Link artifacts back to the session

Each cloud session has a transcript URL on `claude.ai`, and the session can
read its own ID from `CLAUDE_CODE_REMOTE_SESSION_ID`. Use it to put a traceable
link in PR bodies, commit messages, Slack posts, or generated reports:

```bash
echo "https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID}"
```

### Run tests, start services, and add packages

Test runners (`pytest`, `jest`, `cargo test`) work out of the box.

PostgreSQL and Redis are pre-installed but **not running** by default. Start
them per session:

```bash
service postgresql start
service redis-server start
```

Docker is available for containerized services. `docker compose up` works.
Network access to pull images follows the environment's access level; the
**Trusted** defaults include Docker Hub and other common registries.

For large or slow image pulls, add `docker compose pull` or `docker compose
build` to the setup script. Pulled images are cached on disk; running
processes are not, so Claude still starts containers each session.

Packages installed via the setup script are cached and available at every new
session's start. Mid-session installs don't carry over to other sessions.

### Resource limits

Approximate ceilings (subject to change):
- 4 vCPUs
- 16 GB RAM
- 30 GB disk

Memory-intensive jobs may fail or be terminated. For workloads beyond these
limits, use Remote Control to run Claude Code on your own hardware.

### Configure your environment

| Action | How |
|---|---|
| Add an environment | Select the current environment to open the selector, then **Add environment**. Dialog covers name, network access level, environment variables, setup script. |
| Edit an environment | Settings icon to the right of the environment name. |
| Archive an environment | Open the environment, **Archive**. Archived envs are hidden from the selector but existing sessions keep running. |
| Set the default for `--remote` | Run `/remote-env` in your terminal. With a single environment, this just shows current config. `/remote-env` only selects the default; add/edit/archive happen in the web interface. |

Environment variables use `.env` format, one `KEY=value` per line. **Don't** wrap
values in quotes — quotes are stored as part of the value.

```
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgres://localhost:5432/myapp
```

## Setup scripts

A Bash script that runs when a new cloud session starts, before Claude Code
launches. Use to install dependencies, configure tools, or fetch what isn't
pre-installed.

Runs as **root** on Ubuntu 24.04, so `apt install` and most language package
managers work.

Add a setup script via the environment settings dialog → **Setup script** field.

Example installing the (not pre-installed) `gh` CLI:

```bash
#!/bin/bash
apt update && apt install -y gh
```

If the script exits non-zero, the session fails to start. Append `|| true` to
non-critical commands to avoid blocking on intermittent install failures.

Setup scripts that install packages need network access to reach registries.
The default **Trusted** access allows npm, PyPI, RubyGems, crates.io. Scripts
fail to install packages if the environment uses **None** network access.

### Environment caching

The setup script runs the **first time** you start a session in an environment.
After it completes, Anthropic snapshots the filesystem and reuses that
snapshot as the starting point for later sessions. New sessions start with
dependencies, tools, and Docker images already on disk, and the setup script
step is skipped.

The cache captures **files, not running processes**. Anything written to disk
carries over. Services or containers started by the script do not — start
them per session via Claude or a `SessionStart` hook.

The setup script runs again to rebuild the cache when:
- The setup script changes
- Allowed network hosts change
- The cache hits expiry (~7 days)

Resuming an existing session never re-runs the setup script. No manual cache
management needed.

### Setup scripts vs. SessionStart hooks

Use a **setup script** for things the cloud needs but the laptop already has —
language runtime, CLI tool. Use a **`SessionStart` hook** for project setup
that should run everywhere (cloud and local), like `npm install`.

|  | Setup scripts | `SessionStart` hooks |
|---|---|---|
| Attached to | The cloud environment | Your repository |
| Configured in | Cloud environment UI | `.claude/settings.json` in your repo |
| Runs | Before Claude Code launches, when no cached environment is available | After Claude Code launches, on every session including resumed |
| Scope | Cloud environments only | Both local and cloud |

`SessionStart` hooks can also live in user-level `~/.claude/settings.json`
locally, but user-level settings don't carry to cloud sessions. In the cloud,
only hooks committed to the repo run.

### Install dependencies with a SessionStart hook

To install dependencies only in cloud sessions, add a `SessionStart` hook in
`.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/scripts/install_pkgs.sh"
          }
        ]
      }
    ]
  }
}
```

Create `scripts/install_pkgs.sh` (executable). The `CLAUDE_CODE_REMOTE` env var
is `true` in cloud sessions, so use it to skip local execution:

```bash
#!/bin/bash

if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

npm install
pip install -r requirements.txt
exit 0
```

`SessionStart` hook caveats in cloud sessions:
- **No cloud-only scoping** — hooks run in both local and cloud sessions. Check
  `CLAUDE_CODE_REMOTE` to skip local.
- **Requires network access** — installs need to reach registries. **None**
  access blocks them. Default **Trusted** covers npm, PyPI, RubyGems, crates.io.
- **Proxy compatibility** — outbound traffic passes through a security proxy.
  Some package managers don't work correctly with it. Bun is a known example.
- **Adds startup latency** — hooks run each session start/resume, unlike setup
  scripts (cached). Keep them fast: check whether deps are already present
  before reinstalling.

To persist environment variables for subsequent Bash commands, write to
`$CLAUDE_ENV_FILE`. See `SessionStart` hooks documentation.

Replacing the base image with a custom Docker image is **not yet supported**.
Use a setup script to install on top of the provided image, or run your image
as a sidecar container with `docker compose`.

## Network access

Outbound connections from the cloud environment. Each environment has one
access level; extend with custom allowed domains. Default is **Trusted**.

### Access levels

| Level | Outbound connections |
|---|---|
| None | No outbound network access |
| Trusted | Allowlisted domains only: package registries, GitHub, cloud SDKs |
| Full | Any domain |
| Custom | Your own allowlist, optionally including the defaults |

GitHub operations use a separate proxy, independent of this setting.

### Allow specific domains

Pick **Custom** in the environment's network access settings. An **Allowed
domains** field appears. One domain per line:

```
api.example.com
*.internal.example.com
registry.example.com
```

`*.` for wildcard subdomain matching. Check **Also include default list of
common package managers** to keep the Trusted domains alongside custom entries.

### GitHub proxy

For security, all GitHub operations go through a dedicated proxy. The git
client inside the sandbox authenticates using a custom-built scoped credential.
The proxy:
- Manages GitHub authentication securely — git uses a scoped credential inside
  the sandbox, the proxy translates to your actual GitHub token
- Restricts `git push` operations to the current working branch for safety
- Enables cloning, fetching, PR operations while maintaining security boundaries

### Security proxy

Environments run behind an HTTP/HTTPS network proxy for security and abuse
prevention. All outbound internet traffic passes through it:
- Protection against malicious requests
- Rate limiting and abuse prevention
- Content filtering

### Default allowed domains

Under **Trusted** access, the following categories are allowed by default
(domains marked with `*` indicate wildcard subdomain matching):

- Anthropic services
- Version control (github.com, etc.)
- Container registries (`*.gcr.io`, Docker Hub, etc.)
- Cloud platforms (AWS, GCP, Azure SDKs)
- JavaScript and Node package managers (npm)
- Python package managers (PyPI)
- Ruby package managers (RubyGems)
- Rust package managers (crates.io)
- Go package managers
- JVM package managers (Maven Central, etc.)
- Other package managers
- Linux distributions (apt, dnf, etc.)
- Development tools and platforms
- Cloud services and monitoring
- Content delivery and mirrors
- Schema and configuration
- Model Context Protocol

The full list of specific domains is in the live docs.

## Move tasks between web and terminal

Requires the Claude Code CLI signed in to the same `claude.ai` account.

From CLI, session handoff is **one-way**:
- `--teleport` pulls a cloud session into your terminal
- You **cannot** push an existing terminal session to the web from the CLI
- `--remote` creates a **new** cloud session for the current repo
- The Desktop app's **Continue in** menu can send a local session to the web

### From terminal to web

```bash
claude --remote "Fix the authentication bug in src/auth/login.ts"
```

Creates a new cloud session on `claude.ai`. The session clones the current
directory's GitHub remote at the current branch, so **push first** if you have
local commits — the VM clones from GitHub, not your machine. `--remote` works
with a single repository at a time.

`--remote` (creates cloud sessions) is **unrelated** to `--remote-control`
(exposes a local CLI session for monitoring from the web).

Use `/tasks` in the CLI to check progress, or open the session on `claude.ai`
or the mobile app to interact directly.

### Tips for cloud tasks

**Plan locally, execute remotely.** For complex tasks, start in plan mode to
collaborate on the approach, then send to the cloud:

```bash
claude --permission-mode plan
```

Plan mode reads files, explores, proposes a plan without editing source. Save
the plan to the repo, commit, push, then:

```bash
claude --remote "Execute the migration plan in docs/migration-plan.md"
```

**Plan in the cloud with ultraplan.** Generate the plan in a web session while
you keep working, comment on sections in the browser, and choose to execute
remotely or send back to terminal.

**Run tasks in parallel.** Each `--remote` creates an independent cloud
session:

```bash
claude --remote "Fix the flaky test in auth.spec.ts"
claude --remote "Update the API documentation"
claude --remote "Refactor the logger to use structured output"
```

Monitor with `/tasks` in the CLI.

### Send local repositories without GitHub

If `claude --remote` is run from a repo not connected to GitHub, Claude Code
bundles the local repo and uploads it directly. The bundle includes full repo
history across all branches, plus uncommitted changes to **tracked** files.

Activates automatically when GitHub access isn't available. Force it with:

```bash
CCR_FORCE_BUNDLE=1 claude --remote "Run the test suite and fix any failures"
```

Bundle requirements:
- Must be a git repository with at least one commit
- Bundled repo under 100 MB. Larger repos fall back to bundling only the
  current branch, then to a single squashed snapshot of the working tree, and
  fail only if the snapshot is still too large
- Untracked files **not** included; `git add` files you want in the bundle
- Bundled sessions can't push back to a remote unless GitHub auth is also
  configured

### From web to terminal

Pull a cloud session into your terminal via:
- `claude --teleport` — interactive session picker
- `claude --teleport <session-id>` — resume specific session
- `/teleport` (or `/tp`) inside an existing CLI session — same picker, no restart
- `/tasks` → press `t` to teleport into one
- Web interface → **Open in CLI** — copy a paste-ready command

Teleport verifies you're in the correct repository, fetches and checks out
the cloud session's branch, loads conversation history.

`--teleport` is **distinct from** `--resume`. `--resume` reopens a conversation
from this machine's local history. `--teleport` pulls a cloud session and
its branch.

### Teleport requirements

| Requirement | Details |
|---|---|
| Clean git state | Working dir must have no uncommitted changes. Teleport prompts to stash if needed. |
| Correct repository | Must run `--teleport` from a checkout of the same repo, not a fork. |
| Branch available | The branch from the cloud session must have been pushed to the remote. Teleport auto-fetches and checks it out. |
| Same account | Must be authenticated to the same `claude.ai` account used in the cloud session. |

### `--teleport` is unavailable

Requires `claude.ai` subscription authentication. If authenticated via API key,
Bedrock, Vertex AI, or Microsoft Foundry, run `/login` to sign in with your
`claude.ai` account. If already signed in via `claude.ai` and `--teleport` is
still unavailable, your organization may have disabled cloud sessions.

## Work with sessions

Sessions appear in the sidebar at `claude.ai/code`.

### Manage context

Cloud sessions support built-in commands that produce text output. Commands
that open an interactive terminal picker (`/model`, `/config`) are not
available.

| Command | Works in cloud sessions | Notes |
|---|---|---|
| `/compact` | Yes | Summarizes the conversation. Accepts focus instructions: `/compact keep the test output` |
| `/context` | Yes | Shows what's currently in the context window |
| `/clear` | No | Start a new session from the sidebar instead |

Auto-compaction runs automatically near capacity. To trigger earlier, set
`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` (e.g., `=70` to compact at 70% capacity vs
the default ~95%). Use `CLAUDE_CODE_AUTO_COMPACT_WINDOW` to change the
effective window size for compaction calculations.

Subagents work the same as locally. Claude can spawn them via the `Task` tool.
Subagents in `.claude/agents/` are picked up automatically. Agent teams are
**off** by default; enable with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

### Review changes

Each session shows a diff indicator (e.g., `+42 -18`). Open the diff view,
leave inline comments, send them to Claude with the next message. To have
Claude monitor the PR for CI failures and review comments automatically, see
**Auto-fix pull requests** below.

### Share sessions

Toggle visibility per the account types below. Then share the session link.
Recipients see the latest state when they open the link, but their view
**doesn't update in real time**.

**Enterprise / Team** — visibility is **Private** or **Team**. Team makes the
session visible to other members of your `claude.ai` organization. Repository
access verification is enabled by default, based on the recipient's connected
GitHub account. Account display name is visible to all recipients with access.
Claude in Slack sessions auto-share with Team visibility.

**Max / Pro** — visibility is **Private** or **Public**. Public makes the
session visible to any user logged into `claude.ai`. **Repository access
verification is not enabled by default.** Check sessions for sensitive content
before sharing — they may contain code and credentials from private repos. To
require recipients to have repo access, or hide your name from shared sessions,
go to **Settings > Claude Code > Sharing settings**.

### Archive sessions

Hover over a session in the sidebar and select the archive icon. Archived
sessions are hidden from the default list but visible by filtering for
archived.

### Delete sessions

Permanently removes the session and its data — **cannot be undone**. Two ways:
- Sidebar: filter for archived, hover, select delete icon
- Session menu: open session → dropdown next to title → **Delete**

Confirmation required.

## Auto-fix pull requests

Claude watches a PR and automatically responds to CI failures and review
comments. Subscribes to GitHub activity on the PR — when a check fails or a
reviewer comments, Claude investigates and pushes a fix if one is clear.

**Requires the Claude GitHub App** installed on the repository.

Ways to turn on auto-fix:
- **PRs created in Claude Code on the web** — open the CI status bar, select
  **Auto-fix**
- **From terminal** — run `/autofix-pr` while on the PR's branch. Claude Code
  detects the open PR with `gh`, spawns a web session, turns on auto-fix in
  one step
- **From the mobile app** — tell Claude to auto-fix the PR
- **Any existing PR** — paste the PR URL into a session and tell Claude to
  auto-fix it

### How Claude responds to PR activity

For each event:
- **Clear fixes** — confidence + no conflict with earlier instructions →
  Claude makes the change, pushes it, explains
- **Ambiguous requests** — multiple interpretations or architecturally
  significant → Claude asks before acting
- **Duplicate or no-action events** — Claude notes and moves on

Claude may reply to review comment threads on GitHub as part of resolving them.
Replies are posted using **your** GitHub account (so they appear under your
username), but each reply is labeled as coming from Claude Code so reviewers
know it's the agent.

If your repo uses comment-triggered automation (Atlantis, Terraform Cloud,
custom GitHub Actions on `issue_comment` events), be aware that Claude can
reply on your behalf — that can trigger those workflows. Review automation
before enabling auto-fix; consider disabling it for repositories where a PR
comment can deploy infrastructure or run privileged operations.

## Security and isolation

Each cloud session is separated from your machine and from other sessions:
- **Isolated VMs** — each session runs in an isolated, Anthropic-managed VM
- **Network access controls** — limited by default, can be disabled. Even with
  network access disabled, Claude Code can communicate with the Anthropic API,
  which may allow data to exit the VM
- **Credential protection** — sensitive credentials (git credentials, signing
  keys) are never inside the sandbox with Claude Code. Authentication goes
  through a secure proxy using scoped credentials
- **Secure analysis** — code is analyzed and modified within isolated VMs
  before creating PRs

## Troubleshooting

For runtime API errors in the conversation (`API Error: 500`, `529 Overloaded`,
`429`, `Prompt is too long`), see the Error reference. Below: cloud-session
specifics.

### Session creation failed

`Session creation failed` or stalls at provisioning → Claude Code couldn't
allocate a cloud environment.
- Check `status.claude.com` for cloud session incidents
- Retry after a minute (capacity is provisioned on demand)
- Confirm the repository is reachable. Private repos require either the
  GitHub App with access, or a `gh` token synced via `/web-setup`

### Remote Control session expired or access denied

`--teleport` connects through the same Remote Control session infrastructure
that cloud sessions use, so auth/expiry errors surface with Remote Control
wording: `Remote Control session has expired` or `Access denied`. The
connection token is short-lived and account-scoped.
- Run `/login` locally to refresh credentials, then reconnect
- Confirm you're signed in to the same account that owns the session
- `Remote Control may not be available for this organization` → admin hasn't
  enabled remote sessions for your plan

### Environment expired

Cloud sessions stop after inactivity and the underlying environment is
reclaimed. Locally: `Could not resume session ... its environment has expired.
Creating a fresh session instead.` On the web, the session is marked **expired**
in the session list. Reopen the session from `claude.ai/code` to provision a
fresh environment with conversation history restored.

## Limitations

- **Rate limits** — Claude Code on the web shares rate limits with all other
  Claude and Claude Code usage on the account. Parallel tasks consume more
  rate limits proportionately. No separate compute charge for the cloud VM.
- **Repository authentication** — sessions move web→local only when
  authenticated to the same account
- **Platform restrictions** — repository cloning and PR creation require
  GitHub. Self-hosted GitHub Enterprise Server is supported on Team and
  Enterprise plans. GitLab, Bitbucket, and other non-GitHub repos can be sent
  as a local bundle, but the session can't push results back to the remote
- **Organization IP allowlist** — cloud sessions call the Anthropic API from
  Anthropic-managed infrastructure, **not your network**. If your org has IP
  allowlisting enabled, every cloud session fails with an authentication
  error. Same applies to Code Review and Routines. Contact Anthropic support
  to exempt Anthropic-hosted services from your org's IP allowlist.

## Related resources

- **Ultraplan** — draft a plan in a cloud session and review it in your browser
- **Ultrareview** — deep multi-agent code review in a cloud sandbox
- **Routines** — automate work on a schedule, via API call, or in response to
  GitHub events
- **Hooks configuration** — run scripts at session lifecycle events
- **Settings reference** — all configuration options
- **Security** — isolation guarantees and data handling
- **Data usage** — what Anthropic retains from cloud sessions
