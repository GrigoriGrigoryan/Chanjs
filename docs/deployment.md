# Vercel presentation deployment

This adaptation preserves the original feeding experiment at `/` and the embodied sandbox at `/embodied/sandbox/` (shortcut `/sandbox`). It adds loading, mobile, static-hosting and recorded-playback fixes without changing the scientific solver or committed recording data.

Run `npm ci`, `npm test`, and `npm run build`. The allowlisted static site is written to `dist/`. On Vercel use Framework Preset **Other**, the repository root, build command `npm run build`, and output directory `dist`. `vercel.json` supplies those settings. A fork in your own GitHub account permits independent changes and automatic deployment; an authorized local CLI deployment does not itself require a fork. Preserve upstream attribution and data terms.

The browser feeding experiment computes the supplied FlyWire v630 spiking model locally, in a Web Worker. Its network script is about 61 MB, so first load depends on the connection and device. HTTPS, JavaScript, Web Workers and DecompressionStream are required.

The embodied sandbox has two hosted modes:

- **Instant preview:** measured v783 brain decisions interpolated across 100 settings, an approximate kinematic body, a recorded gait clip and activity sampled from measured firing rates. It is not a newly computed whole-brain/MuJoCo trial.
- **Recorded runs:** the original body poses, trajectory, results and 25 ms spike-count windows from committed Python/MuJoCo runs. Replay controls show their recorded parameters; editing a control returns to preview. The optional props/game overlay also returns to preview.

The hosted build disables **Run real simulation**. New full simulations need the Python environment, downloaded circuit data and `embodied/sandbox_server.py`; follow the upstream README. That server uses subprocesses, an in-memory job registry and filesystem output. It is not deployed by this static build. On the reference machine a six-second baseline recording took 515.5 wall seconds. Hosting a job queue, durable result storage and the native simulation runtime is a separate backend integration.

The build injects `window.CHANJ_STATIC_HOSTING=true` into the sandbox HTML. In hosted mode replay files come from `../results/sandbox/<id>/`; the unchanged local Python route remains `/runs/<id>/`. The three.js 0.170.0 import closure and MIT notice are copied from the pinned npm package and served locally. Google Fonts links are removed from the hosted sandbox; system fallbacks apply.

Recorded run links:

- `/embodied/sandbox/?run=2ea7f28129`: baseline, danger 1.6, seed 0; reached food at 6.0 s.
- `/embodied/sandbox/?run=19be51902d`: reward +0.1, punishment −0.2, danger 0.65, seed 7; reached food at 2.325 s. Multiple parameters differ, so this pair is not a controlled single-factor comparison.
- `/embodied/sandbox/?run=313e0f37bc`: one-second baseline sample.

The legacy recorder wrote body poses at offsets 0, 10 and 20 ms within every 25 ms decision window. Playback now honors that cadence instead of treating all frames as uniformly 10 ms apart. The recorded files are unchanged.

The build publishes an explicit frontend/data/replay allowlist. Python source, local datasets, logs, environment files, credentials, unrelated results and development tools are excluded from public output. Keep new artwork small: [Vercel CLI source-upload limits](https://vercel.com/docs/limits) are 100 MB on Hobby and 1 GB on Pro. [Vercel function limits](https://vercel.com/docs/functions/limitations) do not affect the static browser computation.

Original browser code and drawings retain the MIT license in `LICENSE`. Data notices remain in `data/LICENSE`; the repository treats underlying FlyWire connectome reuse as noncommercial under CC BY-NC 4.0. NeuroMechFly/flygym is credited by the upstream project under Apache-2.0. This independent presentation adaptation claims no affiliation or endorsement.
