# 🎙️ Solaris Horizon: Emergence — Character Voice Registry & Casting

This document establishes the **official ElevenLabs voice casting configuration** for all characters in *Solaris Horizon: Emergence*. Always use these designated voice IDs and parameter baselines for cinematics, in-game radio chatter, mission briefings, and audiobook narration to ensure 100% persistent character identity.

The machine-readable configuration is stored in [`data/voices.json`](file:///d:/github/spacegame/data/voices.json).

---

## 🎭 Character Voice Roster

| Character | Voice Name | ElevenLabs Voice ID | Role & Personality | Voice Settings |
| :--- | :--- | :--- | :--- | :--- |
| **Kaylen Vance** | `Liam` | `TX3LPaxmHKxFdv7VOQHJ` | **Protagonist / Interceptor Pilot / Vanguard Scion**<br>Young male pilot, passionate, determined, emotional. | `stability: 0.50`<br>`similarity: 0.80`<br>`style: 0.35` |
| **Elias Vance** | `Bill` | `pqHfZKP75CvOlQylNhV4` | **Adoptive Father / Martian Mechanic Veteran**<br>Wise, gruff older mechanic with scarred lungs and deep fatherly care. | `stability: 0.45`<br>`similarity: 0.85`<br>`style: 0.40` |
| **Precursor AI / Queen Althea** | `Sarah` | `EXAVITQu4vr4xnSDxMaL` | **Royal Ancestral Hologram / Precursor Construct**<br>Mature, regal, enigmatic maternal voice of House Vanguard. | `stability: 0.60`<br>`similarity: 0.85` |
| **Story Narrator** | `George` | `JBFqnCBsd6RMkjVDRZzb` | **Cinematic Storyteller**<br>Deep, warm, British narrative tone for lore and audiobook segments. | `stability: 0.55`<br>`similarity: 0.80` |
| **Jax** | `Roger` | `CwhRBWXzGAHq8TQ4Fs17` | **Cyber-warfare Hacker**<br>Laid-back, cynical, sarcastic tech specialist. | `stability: 0.50`<br>`similarity: 0.75` |
| **Kayl** | `Adam` | `pNInz6obpgDQGcFmaJgB` | **Alien Heavy Weapons Specialist**<br>Dominant, deep, honorable alien warrior. | `stability: 0.65`<br>`similarity: 0.80` |
| **Lyra** | `Lily` | `pFZP5JQG7iQjIQuC4Bku` | **Dominion Defector & Tactician**<br>Velvety, precise, haunted tactician seeking redemption. | `stability: 0.55`<br>`similarity: 0.80` |
| **Regent Vaylen** | `Dominic` | `yhf80q1381zd2JJQ4tM7` | **Iron Dominion Tyrant Dictator**<br>Sinister, brooding, tyrannical warlord. | `stability: 0.40`<br>`similarity: 0.85`<br>`style: 0.50` |

---

## 🛠️ Dialogue Generation Script

Audio for story cinematics is batch-generated using [`scripts/generate_cinematic_dialogue.py`](file:///d:/github/spacegame/scripts/generate_cinematic_dialogue.py).

To generate or re-generate dialogue:
```bash
python scripts/generate_cinematic_dialogue.py
```

Generated assets are stored in:
* `audio/cinematics/titan_gate/`
* `audio/cinematics/titan_gate/manifest.json`
