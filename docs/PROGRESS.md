# GamerBox final polish — progress

One line per item: status + commit. Resume from the first item not marked done.

| Item | Status | Commit |
|---|---|---|
| 0.1 Environment audit (Node 22, JDK 21 at ~/.jdks/jbr-21.0.11, SDK 36, phone SM-S918B) | done | — |
| 0.2 Build health (tsc, lint, build clean; next 14.2.35 = latest 14.2 patch, advisories need a major bump) | done | 842223f |
| 0.3 Security (vault without passwords, simulated Google removed, firestore.rules, env, manifest) | done | ce76484, 842223f, 24a308a |
| 0.4 Asset provenance (Unsplash photos removed, original art) | done | 842223f |
| 0.5 Baseline screenshots (docs/screens/before) | done | 1abf970 |
| 0.6 Checkpoint 1: baseline debug APK (5.1 MB) | done | — |
| 1 Cinematic 3D intro + login stage + login redesign + hero | done | 842223f, 0e0d765 |
| 2 First-run tutorial (carousel + spotlight tour) + empty states | done | 842223f |
| 3 Design fixes (covers, trending, profile, community, settings, light mode, motion) | done | 842223f, 0e0d765 |
| 4 i18n (all strings in dictionary + check script), cleanup, correctness | done | 842223f, 72fa35b |
| 5 Native Android polish (icon, splash, manifest, back, version 1.0.0) | done | 24a308a |
| 6 QA loop (Chrome 390×844 dark/ES + light/EN, intro frames, tutorial steps) | done (1 round); on-device pass pending: phone disconnected | — |
| 7 Final APKs (debug + signed release, verified with aapt/apksigner) + README + CREDITS | done | see log |
