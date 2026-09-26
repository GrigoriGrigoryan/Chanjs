# Vercel presentation deployment

The public presentation opens the embodied sandbox directly at `/`. `/index.html` and `/sandbox` redirect to `/`; the existing `/embodied/sandbox/` entry and its recording links remain available. The original feeding experiment stays in repository source and the local Python server, but its frontend and large v630 network are not included in the public deployment. The presentation adds loading, mobile, static-hosting and recorded-playback fixes without changing the scientific solver or committed recording data.

Run `npm ci`, `npm test`, and `npm run build`. The allowlisted static site is written to `dist/`. On Vercel use Framework Preset **Other**, the repository root, build command `npm run build`, and output directory `dist`. `vercel.json` supplies those settings. A fork in your own GitHub account permits independent changes and automatic deployment; an authorized local CLI deployment does not itself require a fork. Preserve upstream attribution and data terms.

The public embodied presentation is about 35 MB, including three recorded runs. JavaScript and WebGL are required. For the retained feeding experiment, open the source directly or use `/feeding/` on the local Python server; its worker and v630 dataset are deliberately absent from the hosted site.

The embodied sandbox has two hosted modes:

- **Instant preview:** measured v783 brain decisions interpolated across 100 settings, an approximate kinematic body, a recorded gait clip and activity sampled from measured firing rates. It is not a newly computed whole-brain/MuJoCo trial.
- **Recorded runs:** the original body poses, trajectory, results and 25 ms spike-count windows from committed Python/MuJoCo runs. Replay controls show their recorded parameters; editing a control returns to preview. The optional props/game overlay also returns to preview.

The hosted build disables **Run real simulation**. New full simulations need the Python environment, downloaded circuit data and `embodied/sandbox_server.py`; follow the upstream README. That server uses subprocesses, an in-memory job registry and filesystem output. It is not deployed by this static build. On the reference machine a six-second baseline recording took 515.5 wall seconds. Hosting a job queue, durable result storage and the native simulation runtime is a separate backend integration.

The build injects `window.CHANJ_STATIC_HOSTING=true` into both sandbox entry pages. The generated root entry includes `<base href="/embodied/sandbox/">` so module imports, asset requests and replay paths resolve exactly as they do from the nested sandbox. The source root `index.html` is preserved and never copied to the public output. Theme links should use an explicit root URL such as `/?theme=...`; bare query links resolve relative to the base. In hosted mode replay files come from `../results/sandbox/<id>/`; the unchanged local Python route remains `/runs/<id>/`. The three.js 0.170.0 import closure and MIT notice are copied from the pinned npm package and served locally. Google Fonts links are removed from the hosted sandbox; system fallbacks apply.

Recorded run links:

- `/?run=2ea7f28129` (also `/embodied/sandbox/?run=2ea7f28129`): baseline, danger 1.6, seed 0; reached food at 6.0 s.
- `/?run=19be51902d` (also `/embodied/sandbox/?run=19be51902d`): reward +0.1, punishment −0.2, danger 0.65, seed 7; reached food at 2.325 s. Multiple parameters differ, so this pair is not a controlled single-factor comparison.
- `/?run=313e0f37bc` (also `/embodied/sandbox/?run=313e0f37bc`): one-second baseline sample.

The legacy recorder wrote body poses at offsets 0, 10 and 20 ms within every 25 ms decision window. Playback now honors that cadence instead of treating all frames as uniformly 10 ms apart. The recorded files are unchanged.

The behavior presets compare one modulation change in the same arena: Baseline uses reward/PAM 0, Bold uses +1, and Cautious uses −1. Punishment/PPL1 and octopamine remain 0, danger strength 1.6, heading 0°, seed 0, food at (30, 0) and danger at (15, 0). These names describe stronger or weaker approach tendencies, not biological emotions or guaranteed outcomes. In the measured table, blocking PAM weakens food attraction rather than reversing it into aversion. PPL1 drive has little additional effect because endogenous PPL1 is already unusually strong in this model; blocking it releases a much stronger approach response. Octopamine changes walking drive through an assumed gain, not the measured approach/avoid decision.

**Newspaper encounter** is a separate seeded preview available beside the comparison presets, or directly through `/?scene=newspaper`. It restores the original arena, selects PAM +1 with seed 1, enables newspaper mode, uses the overview camera and 0.5× playback speed. The existing collision rule catches this trajectory at 0.800 simulated seconds, without changing the model or any recording data. Try again repeats the same encounter. Manual changes clear its selection; a valid recording link takes precedence over the scene parameter. This is the preview's game overlay, not a new full-brain/MuJoCo trial.

Brand SVGs under `assets/brand/` are included for the favicon and logo. Hosting checks resolve their references from both the root page and the nested sandbox alias. Original loading-art provenance files under `assets/loading/source/` stay in the repository and are excluded from deployment.

The shared mark includes compound eyes, antennae, a central face, and a visible proboscis. The intro's Space Grotesk Bold font is hosted locally under `assets/fonts/`; its SIL Open Font License and source information ship with it. Runtime pages do not request Google Fonts.

The build adds a deterministic 12-character SHA-256 content version to the small UI script, stylesheet, replay-helper and brand URLs. Changes to owned UI assets produce fresh request URLs for returning visitors; identical source content keeps the same version. Root and nested pages use the same version, including logo requests from CSS and the loader. Large scientific data and the pinned three.js modules retain their existing paths.

The build publishes an explicit sandbox/loader/replay/documentation allowlist. Feeding code and its network payload are excluded; `LICENSE`, `data/LICENSE`, and relevant documentation remain available. Python source, local datasets, logs, environment files, credentials, unrelated results and development tools are excluded from public output. Keep new artwork small: [Vercel CLI source-upload limits](https://vercel.com/docs/limits) are 100 MB on Hobby and 1 GB on Pro. [Vercel function limits](https://vercel.com/docs/functions/limitations) do not affect the static browser computation.

Original browser code and drawings retain the MIT license in `LICENSE`. Data notices remain in `data/LICENSE`; the repository treats underlying FlyWire connectome reuse as noncommercial under CC BY-NC 4.0. NeuroMechFly/flygym is credited by the upstream project under Apache-2.0. This independent presentation adaptation claims no affiliation or endorsement.

## Presentation controls and upstream updates

The hosted app starts the instant preview automatically with the apple and newspaper game layer visible, after the first-visit newspaper opening has finished and the application is ready. Simulation time stays paused underneath the opening. The displayed percentage counts completed asset loads, scene construction, and the first rendered frame; requested recordings add their four resources to the plan. It is preparation progress, not a downloaded-byte percentage or timer. Only full readiness allows 100%, the newspaper hit, and the reveal. Returning visits use a shorter opening; `?intro=1` replays the full scene, and reduced-motion preferences use a brief still. `?autoplay=0` starts paused; `?props=0` shows abstract cues; `?cam=follow` selects the following camera. A valid `?run=<id>` opens a recorded run instead of the game overlay. The persistent playback bar always distinguishes preview from recorded results.

Compare the two visual directions using `/?theme=noir` and `/?theme=burgundy`. Noir is the default; old orange links migrate to Noir. The selected theme is saved locally. At desktop widths of at least 1100px, all settings sections stay open in a scrolling sidebar with Reset pinned at the bottom, beside a large arena and smaller brain view. Mobile Arena and Brain views share one screen; Controls and detailed readouts open in dialogs that can be pulled down to dismiss. Scientific group colors and all recorded files are preserved. Hidden 3D panes skip rendering, and the chemical-change highlight updates at 12.5 Hz while its shader animation remains smooth.

The GitHub fork deploys its own main branch through Vercel. Commits in K4ryan/Chanjs do **not** automatically enter the fork. This release merges upstream `4b2a2df` (brain-view chemical-path highlighting). For future updates, fetch upstream, review and merge on a branch, run checks, then push the reviewed result to the fork's main branch. Do not overwrite the presentation changes with an unreviewed sync.
