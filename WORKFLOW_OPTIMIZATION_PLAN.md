# Workflow optimization implementation plan

Status: active implementation plan. Source of truth for sequencing and acceptance
until replaced by measured results.

## Target outcome

Reduce repeated pointer movement, window/app switching, clipboard handling and
workspace setup while keeping Charybdis actions predictable and portable. Keep
the keyboard layout usage-led: L1 remains the high-frequency universal layer,
the Norwegian symbol cluster keeps a high-value position, L7 remains the safe
fallback, and other layers may be renumbered/reorganized as a coordinated
migration. Coach remains a teaching/visual tool; it must not claim that a
shortcut or layout passes a task or contract.

## Verified current state

- The current portable layout is `coach/data/keybindings_explained.csv`.
- L2 currently groups `< @ = + ?` at x1–5,y2, plus browser, Windows, Office,
  file and terminal shortcuts. L3 contains tab switching, browser navigation,
  editing, Claude, M-Files and Explorer actions. `\` is missing from the L2
  symbol cluster and must be added there in the corrected base layout.
- The current host map shows why the displayed `\` is misleading: L0 x12,y3
  sends HID Backslash and Pipe, which nb-NO renders as `'` / `*`. HID Equal and
  Plus renders as `\` / a dead grave key, but that HID output is not currently
  in the L2 symbol cluster. Also, L2 x3,y2 is AltGr+0, which the host map says
  produces `}`, while Shift+0 produces `=`. Correct these bindings in the
  upcoming reviewed layout; do not infer output from US HID labels.
- L1 includes the user's mouse controls, monitor movement, window snapping,
  command palette, Walk This Way, text extraction, File Explorer, clipboard,
  zoom pair, Alt+Left/Right, MB4/MB5 and spatial focus actions. Preserve these
  while the usage study is prepared.
- L7 has Bluetooth controls, recovery keys and fallback bindings; do not
  repurpose it.
- The available root `shortcut_usage.jsonl` runs from 2026-09-29 through
  2026-10-23. It predates the current layout, so it cannot justify current
  placement changes. Collect a new baseline from the date the current layout
  was applied.
- Optimizer run snapshots in this checkout contain events through
  2026-11-05T03:58:32Z. The current portable layout is versioned
  `usage-ranked-20261106`; the exact physical application time is not recorded
  here. Filtering the latest available snapshot from 2026-11-06 returns zero
  events, so it still cannot establish use of the current layout.
- Portable AHK logs active layer and shortcut sequences. The logger had no
  physical `SC00D` hook for the HID Equal/Plus key that emits `\` under nb-NO;
  a hook was added. The usage analyzer now reports emitted Norwegian symbols
  separately.
- Layer-aware shortcut logging, shortcut sequence logging, mouse sessions, and
  layer attribution predate this plan. They are inputs to reuse, not new
  deliverables. Only the `SC00D` backslash hook and the analyzer's handling of
  `layer_key`/symbol events are current code corrections.
- F13–F18 collision audit is complete for checked repo files: current layout
  CSV has no F13–F18 output binding; layout specs describe F13–F15 as spare
  macro triggers; plain F16/F17/F18 invoke input-method actions; numerous
  Ctrl/Alt/Win/Shift+F13–F18 combinations are reserved for Coach beacon events.
  Firmware and live Windows key delivery still require Windows/keyboard
  verification before assigning any of those keys.
- No assistant-response-copy extension or multi-item clipboard collector is
  retained or planned. User rejected response copy and asked why a collector
  is needed when Win+V history already exists.

## Implementation status

| Work | Repo state | Runtime state |
|---|---|---|
| Manual observation utility | Metadata-only JSONL/Markdown CLI implemented; synthetic tests pass | Must be invoked manually; does not implement the optimization agent |
| Existing shortcut usage | Existing AHK producer records layers, shortcut sequences, mouse sessions and symbol events | Analyzer now includes `shortcut`, `layer_key`, `shortcut_sequence`, and `norwegian_symbol_key`; latest available snapshot filtered from 2026-11-06 onward yields zero events |
| Low-friction conversational agent | Not implemented | Does not yet identify material workflow friction and update the observation record during normal conversation |
| L2/L3 migration | Complete scoring/migration method documented below | Not generated; current-layout data absent |
| Norwegian symbol logging | Added `SC00D` physical hook and analyzer output | AHK runtime smoke test still needed on Windows |
| AHK semantic router | Design explanation documented; no routing chosen | Not changed |
| Terminal/workspace/BLE/Coach work | Requirements and acceptance checks documented | Not changed or tested on Windows |

These distinctions are intentional: repository artifacts do not prove that a
Windows process is running, an Edge extension is loaded, a key is mapped, or
firmware is flashed.

## Architecture explanation (proposal, not a user decision)

“Semantic action” means a key represents one named goal, such as “open a
workspace.” Software can implement that goal differently depending on the
focused app, while the key's purpose stays the same. That differs from a key
whose meaning changes to unrelated actions in different apps. This was a design
option in the report, not a choice made by the user; no such router has been
added. The rejected response-copy action is excluded.

## Work packages

### A. Fresh usage baseline and layer migration

**Inputs:** applied-layout date, matching `shortcut_usage.jsonl`, current CSV,
firmware keymap, access-path map.

**Analysis:** count actions by physical binding and layer; distinguish direct
L0 convenience from actual use on other layers; compute co-occurrence and
sequence links; discount duplicates only when the user allows them; separate
mouse-session use, emitted Norwegian symbols, and explicit favorites. Report
physical scan code and produced character for symbol events so US HID labels do
not hide nb-NO output. Report sample coverage, stale/missing days and confidence.

**Migration:** assign L2/L3 roles and move current content into useful lower
frequency layers. Keep access routes reachable and conflict-free. Preserve L1
and L7 unless evidence and user direction explicitly authorize changes.

**Starting architecture to score, not hard-code:** keep the complete Norwegian
symbol cluster, including `\`, together on L2 as a base-layout requirement.
Use L2/L3 as candidate homes for manually selected special shortcuts, alongside
L1. Move current L2/L3 bindings into other layers according to observed
per-layer use, conjunctions, familiarity, and reachable access paths. The
special shortcuts begin as a temporary pool; ordinary use determines which
remain on L2/L3, move to L1, or move elsewhere.

**Acceptance:** every logged action maps to its actual layer/key; every moved
action has a destination or is explicitly retired; required pairs remain
grouped; Norwegian symbols and layer access remain usable; CSV, JSON, ZMK
bindings, logger attribution and Coach rendering agree. Present the resulting
layout for review before firmware flashing or applying it.

**Current blocker:** no post-application log is present in this workspace. This
does not block software work; it blocks evidence-based layer assignment.

### B. Manually added shortcut pool

After the base layout plan is ready, add selected special shortcuts to a
temporary pool. Then let ordinary usage determine whether each stays
on L2/L3, moves to L1, or moves to a lower-frequency layer. A pool entry is not
a permanent assignment or a reason to protect its position.

The report's workspace launcher and agent/session selector remain candidates.
Plain-text paste is an optional candidate only if the existing PowerToys action
is installed and its value is confirmed. The user rejected “Copy latest
assistant message” and a second clipboard collection buffer. Do not preassign
F13–F18; the actual pool and placements will be manually selected after the
base plan.

### C. Clipboard history

- Keep Win+V as the existing clipboard-history workflow. Do not add a second
  collection buffer that duplicates its purpose.
- If plain-text paste remains useful, use the existing PowerToys feature and
  map it only after the user approves it as part of the special-shortcut pool.
- Do not add a multi-item collection buffer.

### D. Terminal sessions

- First inspect actual Windows Terminal settings, profile names, and how the
  user currently runs up to five agents.
- Prefer stable named tabs with direct focus if the user keeps one AgentHub
  window; prefer named windows if agents need independent monitor placement.
- Use `wt -w <name> focus-tab -t <index>` only after validating local WT version
  and named-window behavior. No session is killed, reordered, or restarted by
  the switcher.

### E. Browser keyboard navigation

- Trial link hints/tab search before consuming Charybdis positions.
- Record extension, exclusions, useful commands and any pages where hints
  interfere. Keep the trial reversible.

### F. Workspace presets

- Build a small JSON preset format after the user names actual workspaces,
  windows, launch behavior, and focus target.
- Use per-monitor work areas and DPI-aware coordinates. Reuse existing
  FancyZones layouts; do not edit PowerToys internal layout files.
- Acceptance covers existing/missing windows, duplicate app windows, title
  changes, existing monitor scaling, and no movement of unnamed windows.

### G. BLE / trackball diagnosis

- Record keyboard/firmware identity, active profile, host adapter, and current
  ZMK radio options before changes.
- Compare identical pointer sweeps over USB and BLE with timing/count data;
  test stationary, slow and fast motion separately from scroll.
- Only change radio/host settings if measured gaps or reconnect behavior
  identify a cause. Keep bond deletion as last-resort recovery.

### H. Coach layer-state visualization

- Audit current beacon events and layer tracking first.
- Represent held layers as a set; resolve key output according to ZMK's actual
  active-layer precedence; model press/release transitions and hold-tap timing
  separately from plain momentary holds.
- Show the real shortest momentary path and held-state sequence. Do not add
  score, contract, success, task-completion or pass/fail indicators.

### I. Continuous optimization observations

- Build the actual conversational agent workflow: answer the immediate
  workflow question first; use existing app/shortcut knowledge and check
  current documentation when needed; only record an observation when it
  removes repeated steps, pointer movement, search, or recurring failure.
- The agent must add/update metadata itself when that is appropriate; the user
  should not have to run the observation CLI manually during normal use.
- Use existing layer-aware logs to validate later whether an accepted shortcut
  or workflow is actually used. Do not reimplement keyboard logging or infer
  usage from conversation text.
- Suggestions remain reviewable; the agent does not silently change layouts,
  firmware, AHK behavior, or external applications.
- Only record material friction that removes repeated steps/pointer movement,
  fixes recurring reliability, or replaces repeated search/rearrangement.
- Store structured metadata and short human-readable summaries, never source
  content, clipboard text, prompts, customer details, or response bodies.
- Statuses: discovered, validated, implemented, rejected. Update an existing
  item when feedback concerns the same friction.
- Rank candidates by observed frequency × friction × confidence; use estimated
  time saved only as a secondary estimate.

## Overall completion gates

1. Source/audit: exact applied-layout date, fresh usage coverage, complete key
   collision map, verified app/runtime versions.
2. Prototype: each manually selected pool action tested in its target app; any
   selected Terminal mechanism tested on Windows.
3. Layout: usage-driven migration reviewed, no unreachable layers or lost
   required actions, generated artifacts consistent.
4. Runtime: changes installed/reloaded on Windows; smoke test each action in
   its target application; record repo state separately from live state.
5. Publication: only push after implementation and Windows verification; report
   exact commit and push result. Firmware flashing requires an explicit later
   request, consistent with the user's established review/apply workflow.

## Open inputs (record only when established)

- Exact date the current user layout was applied. Do not infer it from a CSV
  commit date. Use it as the first accepted event in the new layout log.
- Current-layout usage file from the Windows portable logger and confirmation
  that it includes the period after application.
- Named workspace presets, target applications/windows, and desired
  create/reuse behavior. User said they will define these arrangements.
- Current Windows Terminal version, profile/window naming, and preferred agent
  session model (fixed tabs versus independent windows).
- Current PowerToys version and whether Advanced Paste plain-text action is
  enabled.
- Bluetooth host adapter identity and physical connection arrangement for the
  controlled USB/BLE comparison.
- Whether to trial a browser hint extension and any site exclusions.

## Immediate next actions

1. Inspect the actual Windows runtime/profile and find the current-layout
   application date and fresh log source.
2. Verify `SC00D` logging on Windows and verify emitted backslash, equals, plus,
   question mark, AltGr symbols, and the `< > |` group.
3. Capture fresh layer-aware use, then build and review the L2/L3 migration.
4. Manually add selected pool shortcuts and evaluate after normal
   usage; do not treat those placements as permanent.
5. Implement Terminal/workspace/BLE/Coach packages in observed priority order.

## User decisions

- Add selected special shortcuts manually after the base layout plan. Treat
  them as a temporary pool, then use ordinary, layer-aware usage to decide
  whether they stay on L2/L3, move to L1, or move elsewhere.
- Keep the Norwegian programming-symbol cluster together on L2 and log actual
  emitted symbols. `\` is a required cluster member, not an optional pool key.
- Use existing Win+V clipboard history. Do not add a separate collection buffer.
- Do not build or install “Copy latest assistant message.”
- Coach is a teaching/visual interface, not a scoring, pass/fail, or task
  completion system.
- Preserve L7 as the established fallback layer.
- Preserve frequently used shortcuts unless newer layer-specific evidence
  shows that shortcut is less useful on that layer; use observed sequences to
  group shortcuts that are often used together.
