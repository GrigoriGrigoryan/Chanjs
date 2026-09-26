# Chanjs: a fly brain that decides, a fly body that walks

A whole-brain spiking model of the fruit fly (FlyWire v783, 138,639 neurons, 15.1 M connections, Shiu et al. 2024 parameters) runs in closed loop with a physics body (NeuroMechFly/MuJoCo) in an odor arena. Change **dopamine** and **octopamine** levels, and see whether the fly walks past danger to reach food.

```
odor at antennae ─► food / danger ORNs ─► whole brain ─► mushroom body ─► approach vs avoid MBONs = VALENCE
                                                           ▲
            dopamine knobs ─► real PAM / PPL1 neurons ─────┘ (scale KC→MBON synapses in their compartments)

VALENCE × food-odor L/R contrast ─► steering reflex ─► [left, right] leg drive ─► body walks
```

Model details, data vs. assumptions, and findings are in [embodied/README.md](embodied/README.md).

## Requirements

- Tested on Windows 11 with Python **3.12.3**, a Ryzen 5 5600H (6 cores) and 11 GB RAM. No GPU is used.
- About 2 GB of free disk: 190 MB of data, plus the Python environment.
- Git, and optionally Node 22 for the original browser app's tests.

## Replicate (PowerShell, from a fresh clone)

```powershell
git clone https://github.com/<you>/Chanjs.git
cd Chanjs\embodied
py -3.12 -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt   # exact pinned environment
.venv\Scripts\python fetch_data.py                        # downloads 135 MB from pinned commits, checks SHA256, builds data/circuit.npz
.venv\Scripts\python test_brain.py                        # must print "fixture ok" and "dopamine ok"
.venv\Scripts\python sandbox_server.py                    # open http://127.0.0.1:8765
```

On Linux or macOS, use `python3.12` and `.venv/bin/python`.

In the sandbox:
- Drag the food and danger, then move the sliders and press **▶ Start** for the instant preview.
- **Run real simulation** runs the full brain plus physics, about 80 s of wall time per simulated second.
- To replay the committed recordings, add these to the URL:

  | URL | Run |
  |---|---|
  | `?run=2ea7f28129` | baseline, danger 1.6, 6 s |
  | `?run=19be51902d` | reward +0.1, punish −0.2, danger 0.65 |

The sandbox assets in `embodied/sandbox/assets/` are committed. To rebuild them, run `export_assets.py` (minutes) and `precompute_valence.py` (about 2 h).

## Reproduce the recorded results

Run everything from `embodied/`. Each command writes JSON, a trajectory plot and a seed-0 video. The results table is printed at the end of the matching `results/logs/*.log`. Wall times are from the tested PC, running 4 trials in parallel.

| Output | Command | Wall time |
|---|---|---|
| `results/calibration*` | `.venv\Scripts\python sweep.py --set calibration --seeds 8` | 26 min |
| `results/danger_<d>/` (d = 1, 1.5, 1.75, 3, 6) | `.venv\Scripts\python sweep.py --set baseline --seeds 8 --danger <d> --out results/danger_<d>` | 8–14 min each |
| `results/knobs/` (main experiment) | `.venv\Scripts\python sweep.py --set knobs --seeds 8 --danger 1.6 --out results/knobs` | 65 min |
| a single trial / video | `.venv\Scripts\python run.py --seed 0 --dopamine-reward 1 --danger 1.6 --video out.mp4` | about 8 min |

`results/danger_2/` is an interrupted run: it has the video only.

Main result, from `results/logs/results_knobs.log`: the fly reached the food behind the danger in **3/8** baseline trials. That rose to **8/8** with reward dopamine up and **8/8** with punishment dopamine blocked, and fell to **0/8** with reward dopamine blocked.

**Determinism:** everything is seeded, so reruns on the same machine give identical trials. Another CPU or OS can differ in the last floating-point bits, which can flip a borderline trial but not the overall table.

## Repository map

| Path | What it is |
|---|---|
| `embodied/` | Brain (`brain.py`), closed-loop trial (`run.py`), sweeps (`sweep.py`), data build (`fetch_data.py`), 3D sandbox (`sandbox/`, `sandbox_server.py`) |
| `embodied/results/` | All recordings: MP4 videos, sweep JSON, trajectory PNGs, sandbox replays (`sandbox/<id>/`), console logs (`logs/`) |
| `index.html`, `model.js`, `app.js`, `data/` | The original browser proboscis-feeding experiment, plus the Phase 1 modulator assay. See [docs/feeding-app.md](docs/feeding-app.md). |
| `tests/` | `node --test tests/*.test.cjs` |

## Credits and licenses

- **Base project:** [dicnunz/fly-brain-feeding](https://github.com/dicnunz/fly-brain-feeding), © Nic Dunzelman, [MIT](LICENSE).
- **LIF model and weights:** Shiu et al., *Nature* 2024 ([philshiu/Drosophila_brain_model](https://github.com/philshiu/Drosophila_brain_model)).
- **Connectome and annotations:** FlyWire (Dorkenwald et al. 2024; Schlegel et al. 2024), **CC BY-NC 4.0**, so the connectome is for non-commercial use only.
- **Body:** NeuroMechFly / [flygym](https://github.com/NeLy-EPFL/flygym), Apache-2.0.
- **3D rendering:** three.js, MIT.
