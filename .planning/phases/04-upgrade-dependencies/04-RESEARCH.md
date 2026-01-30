# Phase 4: Upgrade Dependencies - Research

**Researched:** 2026-01-30
**Domain:** npm/pnpm dependency management and version upgrading
**Confidence:** MEDIUM

## Summary

This research investigates best practices for upgrading npm/pnpm dependencies in a Vue 3 project. The goal is to upgrade all dependencies (including devDependencies) while maintaining project stability.

The standard approach involves using specialized tools like `taze` or `npm-check-updates` to identify outdated packages, followed by systematic testing to ensure compatibility. Modern best practices emphasize incremental upgrades over "big bang" updates, with careful attention to breaking changes in major version updates.

The project currently has 23 outdated packages (as of 2026-01-30), with several major version updates available including Vue Router 4→5, Vite 6→7, and various devDependencies. Since the project has no test suite, manual verification through build and runtime testing will be critical.

**Primary recommendation:** Use `taze` for its speed and interactive mode, upgrade packages incrementally starting with patches/minors, verify each upgrade level works before proceeding to majors, and prioritize critical dependencies (Vue ecosystem) separately from tooling.

## Standard Stack

The established tools for dependency upgrading:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| taze | latest | Interactive dependency upgrader | Fast, monorepo-native, excellent DX, created by Vue core team member |
| npm-check-updates (ncu) | latest | CLI dependency upgrader | Industry standard for 10+ years, extensive configuration options, doctor mode |
| pnpm | 10.10.0 (current project) | Package manager | Built-in `pnpm outdated` and `pnpm update` commands |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pnpm outdated | built-in | Check outdated packages | Quick check without installing tools |
| pnpm update --interactive | built-in | Interactive upgrade within semver ranges | Safe updates respecting package.json ranges |
| pnpm update --latest | built-in | Update to latest ignoring ranges | When you want to upgrade beyond current ranges |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| taze | npm-check-updates | NCU has more advanced filtering and "doctor mode" for automated testing, but slower |
| CLI tools | Renovate/Dependabot | Full automation with CI/CD integration, but overkill for one-time upgrades |
| Manual | pnpm update | Built-in but less visibility into what's outdated and less control over upgrade scope |

**Installation:**
```bash
# Taze (recommended for this project)
npx taze

# Or npm-check-updates
npx npm-check-updates
```

## Architecture Patterns

### Recommended Upgrade Workflow

```
1. Preparation Phase
   ├── Commit all changes
   ├── Ensure clean working directory
   └── Create backup branch

2. Discovery Phase
   ├── Run `pnpm outdated` to see what's outdated
   ├── Run `npx taze` to see detailed upgrade info
   └── Categorize updates: patch, minor, major

3. Incremental Upgrade Phase
   ├── Phase 1: Patches first
   │   ├── `npx taze patch -w` (write mode)
   │   ├── `pnpm install`
   │   ├── Test: `pnpm build` + `pnpm dev` + manual verification
   │   └── Commit if successful
   │
   ├── Phase 2: Minors
   │   ├── `npx taze minor -w`
   │   ├── `pnpm install`
   │   ├── Test: `pnpm build` + `pnpm dev` + manual verification
   │   └── Commit if successful
   │
   └── Phase 3: Majors (critical packages separately)
       ├── Vue ecosystem first (vue, vue-router, @vueuse/core)
       ├── Build tools (vite, @vitejs/plugin-vue)
       ├── Other dependencies
       └── Each major: upgrade → test → commit individually

4. Verification Phase
   ├── Full build: `pnpm build`
   ├── Development mode: `pnpm dev`
   ├── Lint: `pnpm lint`
   ├── Type check: `pnpm type-check`
   └── Manual testing in browser
```

### Pattern 1: Interactive Mode with Grouping
**What:** Use taze's interactive mode to selectively upgrade packages by update type
**When to use:** For projects without automated tests (like this one)
**Example:**
```bash
# Source: https://github.com/antfu/taze
# Interactive mode with automatic grouping by update type
npx taze -I

# Filter to specific update levels
npx taze major -I  # Only show major updates
npx taze minor -I  # Only show minor updates
```

### Pattern 2: Scoped Upgrades
**What:** Upgrade related packages together
**When to use:** When dealing with ecosystem packages that depend on each other
**Example:**
```bash
# Source: taze documentation
# Upgrade only Vue ecosystem
npx taze -f "vue*,@vueuse/*,reka-ui" -w

# Upgrade only build tools
npx taze -f "vite*,@vitejs/*,unplugin-*" -w

# Upgrade only linting/formatting
npx taze -f "eslint*,lint-*,prettier" -w
```

### Pattern 3: Dry Run First
**What:** Always check what will be upgraded before writing
**When to use:** Every upgrade session
**Example:**
```bash
# Check what would be upgraded
npx taze major

# Only write after reviewing
npx taze major -w
```

### Anti-Patterns to Avoid
- **Big Bang Upgrade:** Upgrading all packages at once without categorization makes it impossible to identify which package caused a break
- **Ignoring Semver Ranges:** Running `pnpm update --latest` without understanding implications can break projects
- **No Verification Between Steps:** Upgrading multiple packages then testing only at the end wastes time when debugging
- **Upgrading Without Clean Git State:** Makes it impossible to revert specific changes
- **Skipping Lock File Updates:** Not running `pnpm install` after package.json changes can cause inconsistencies

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Checking outdated versions | Manual npm registry queries | `pnpm outdated` or `taze` | Handles semver parsing, registry querying, rate limiting, caching |
| Updating package.json ranges | String replacement scripts | `taze -w` or `ncu -u` | Correctly preserves range operators (^, ~, >=), handles edge cases |
| Finding breaking changes | Reading every changelog manually | Check major version updates selectively | Too time-consuming; incremental testing is more efficient |
| Rollback mechanism | Manual file restoration | Git branches and commits | Built-in, reliable, includes lock file |
| Dependency tree conflicts | Manually resolving peer deps | `pnpm install` with `--peer` flag awareness | Package manager handles resolution algorithms |

**Key insight:** Dependency management has complex edge cases around semver parsing, registry APIs, peer dependencies, and version conflict resolution. Mature tools like taze and pnpm have solved these problems. Custom scripts invariably miss edge cases and become maintenance burdens.

## Common Pitfalls

### Pitfall 1: Major Version Zero Instability
**What goes wrong:** Packages with version 0.x.x (pre-1.0) can introduce breaking changes in minor or patch versions
**Why it happens:** Semver spec states major version zero is for initial development where anything may change
**How to avoid:**
- Review changelogs for 0.x packages before upgrading even minor versions
- Test 0.x upgrades as carefully as major version upgrades
- Consider pinning unstable 0.x packages if stability is critical
**Warning signs:** Package version starts with 0., frequent version bumps

### Pitfall 2: Peer Dependency Conflicts
**What goes wrong:** Upgrading package A breaks package B because B has peer dependency on A@older
**Why it happens:** npm/pnpm don't enforce peer dependencies strictly; conflicts appear at runtime
**How to avoid:**
- Check `pnpm install` warnings after each upgrade
- Use `pnpm outdated --format list` to see peer dependency constraints
- For critical packages (like Vue), upgrade all ecosystem packages together
**Warning signs:** Console warnings like "unmet peer dependency", runtime errors after upgrade

### Pitfall 3: Breaking Changes in Tooling
**What goes wrong:** Upgrading build tools (Vite, TypeScript) breaks the build without changing application code
**Why it happens:** Build tools often change config schema, plugin APIs, or compilation targets
**How to avoid:**
- Read migration guides for major versions of Vite, TypeScript, bundlers
- Test build, dev mode, and type checking separately
- Check for deprecated config options in current version before upgrading
**Warning signs:** Build errors mentioning "unknown option", "plugin API changed", type errors in node_modules

### Pitfall 4: Caret Range Trap
**What goes wrong:** `^0.1.0` behaves differently than `^1.0.0` - it only allows patch updates, not minor
**Why it happens:** Caret range for major version zero is special-cased in semver
**How to avoid:**
- Understand `^0.1.0` → matches `0.1.x`, NOT `0.x.x`
- For 0.x packages, consider using `~` (patch only) or specific versions
- When upgrading 0.x packages, always check manually even for "minor" updates
**Warning signs:** Package stuck on old version despite "safe" upgrade command

### Pitfall 5: Lock File Corruption
**What goes wrong:** Manually editing package.json without `pnpm install` causes version mismatches
**Why it happens:** Lock file (pnpm-lock.yaml) doesn't auto-update when package.json changes
**How to avoid:**
- ALWAYS run `pnpm install` after any package.json modification
- Use tools like taze that can update package.json and prompt for install
- Never manually edit pnpm-lock.yaml
**Warning signs:** "Cannot find module" errors, version mismatches between package.json and installed

### Pitfall 6: ESM/CJS Compatibility
**What goes wrong:** Upgrading to ESM-only version of a package breaks imports
**Why it happens:** Some packages have migrated to pure ESM (no CommonJS)
**How to avoid:**
- This project uses `"type": "module"` so it's ESM-ready
- Still check if any dependencies are CJS-only and haven't been updated
- Vite handles most ESM/CJS interop automatically
**Warning signs:** "ERR_REQUIRE_ESM", "Cannot use import statement outside a module"

### Pitfall 7: No Test Suite = Higher Risk
**What goes wrong:** Breaking changes aren't caught until manual testing or production
**Why it happens:** This project has no automated tests (no *.test.ts or *.spec.ts files)
**How to avoid:**
- Extra caution with major version upgrades
- Comprehensive manual testing checklist after each upgrade phase
- Consider priority: upgrade dev tools before runtime dependencies
**Warning signs:** Everything builds but features break at runtime

## Code Examples

Verified patterns from official sources:

### Safe Incremental Upgrade
```bash
# Source: https://github.com/antfu/taze README
# Check what's outdated with grouping
npx taze

# Upgrade patches only (safest)
npx taze patch -w
pnpm install

# Test build and dev
pnpm build && pnpm dev

# If successful, upgrade minors
npx taze minor -w
pnpm install
pnpm build && pnpm dev

# Finally majors, interactively
npx taze major -I
```

### Interactive Selection
```bash
# Source: https://github.com/antfu/taze README
# Interactive mode to pick specific packages
npx taze -I

# Within interactive mode:
# - Use arrow keys to navigate
# - Space to select/deselect
# - Enter to upgrade selected
# - Ctrl+C to cancel
```

### Checking Current State
```bash
# Source: https://pnpm.io/cli/outdated
# pnpm built-in outdated checker
pnpm outdated

# With detailed output
pnpm outdated --long

# Only production dependencies
pnpm outdated --prod

# JSON output for scripting
pnpm outdated --format json
```

### Filtering Specific Packages
```bash
# Source: https://github.com/antfu/taze README
# Upgrade only packages matching pattern
npx taze -f "vue*" -w

# Exclude specific packages
npx taze -x "eslint*" -w

# Combine filters
npx taze -f "@vueuse/*" -x "@vueuse/core" -w
```

### Update Within Ranges
```bash
# Source: https://pnpm.io/cli/update
# Update to latest within package.json ranges (safest)
pnpm update

# Update to absolute latest (ignores ranges)
pnpm update --latest

# Interactive update within ranges
pnpm update --interactive

# Update specific package to latest
pnpm update vue --latest
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm-check-updates only | taze or ncu | 2020-2023 | Taze offers better performance and modern DX, especially for pnpm/yarn users |
| Manual upgrade all at once | Incremental by update level | Ongoing trend | Reduces risk and debugging time significantly |
| Ignore security updates | Security-first with audit | 2020+ | npm audit and pnpm audit integrated into workflow |
| Trust major version zeros | Treat 0.x as unstable | Always per semver | Major version zero explicitly unstable in semver spec |
| Update when convenient | Continuous micro-updates | 2025+ trend | Automated bots (Renovate, Dependabot) for always-current deps |

**Deprecated/outdated:**
- `npm outdated`: Still works but `pnpm outdated` is faster and more reliable for pnpm projects
- Manually editing package.json: Tools like taze prevent syntax errors and respect semver rules
- "Update everything quarterly": Modern practice prefers small, frequent updates over big quarterly updates

## Open Questions

Things that couldn't be fully resolved:

1. **Project-specific Breaking Changes**
   - What we know: Several major version updates are available (vue-router 4→5, vite 6→7)
   - What's unclear: Specific breaking changes that will affect this project's code
   - Recommendation: Must read migration guides for each major version upgrade during implementation

2. **Testing Strategy Without Test Suite**
   - What we know: Project has no automated tests (no *.test.ts or *.spec.ts files)
   - What's unclear: How comprehensive manual testing needs to be to ensure stability
   - Recommendation: Create manual testing checklist covering all major features before starting upgrades

3. **Reka UI Breaking Changes**
   - What we know: reka-ui upgrade from 2.3.0 → 2.8.0 is available (minor version)
   - What's unclear: Whether this introduces breaking changes (project heavily relies on this for checkboxes)
   - Recommendation: Check Reka UI changelog carefully as it's a core dependency for Phase 1 & 2 features

4. **Vue Router 5 Migration Impact**
   - What we know: Major version update available (4.5.1 → 5.0.1)
   - What's unclear: Whether project uses any deprecated Vue Router 4 APIs
   - Recommendation: Read Vue Router 5 migration guide before upgrading; may require code changes

5. **Build Tool Chain Compatibility**
   - What we know: Vite 6→7 and related plugins have major updates
   - What's unclear: Whether Vite 7 works with current project structure and other plugins
   - Recommendation: Upgrade Vite ecosystem together after reading Vite 7 breaking changes

## Sources

### Primary (HIGH confidence)
- https://pnpm.io/cli/update - pnpm update command documentation
- https://pnpm.io/cli/outdated - pnpm outdated command documentation
- https://github.com/antfu/taze - Taze official repository and README
- https://github.com/raineorshine/npm-check-updates - npm-check-updates official repository
- Project's current package.json - Current dependency versions and ranges
- `pnpm outdated` output - Actual outdated packages in this project (23 packages as of 2026-01-30)

### Secondary (MEDIUM confidence)
- WebSearch: "npm dependency upgrade best practices 2026" - Modern workflow patterns
- WebSearch: "pnpm update dependencies safely 2026" - pnpm-specific strategies
- WebSearch: "npm-check-updates taze comparison 2026" - Tool selection guidance

### Tertiary (LOW confidence)
- WebSearch: "dependency upgrade common pitfalls 2026" - General pitfall patterns (needs project-specific validation)
- WebSearch: "Vue 3 dependency upgrade breaking changes 2026" - No useful results (must check actual changelogs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - pnpm, taze, and npm-check-updates are well-documented and widely used
- Architecture: MEDIUM - General patterns are solid, but project-specific testing strategy needs refinement
- Pitfalls: MEDIUM - Standard pitfalls are known, but project-specific risks require code review during implementation

**Research date:** 2026-01-30
**Valid until:** 2026-02-28 (30 days - dependency management is relatively stable, but specific package versions change frequently)
