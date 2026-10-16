# E-learning « Installation électrique chez le client » — Académie Fnac Darty

Module destiné aux livreurs-installateurs (gros électroménager et TV) : limites d'intervention sur l'installation électrique du client.
3 items (≈ 16 min) + quiz de 10 questions (80 % pour valider), voix off française, package **SCORM 1.2**.

> ⚠️ Contenu interne Fnac Darty (logo Académie, photos issues des supports de formation) : garder ce dépôt **privé**.

## Utiliser le module
Importer `dist/Module_SCORM12_installation_electrique.zip` dans la plateforme e-learning (SCORM 1.2).
- Statut : `incomplete` → `passed` (≥ 8/10) ou `failed` ; score remonté en % ; seuil 80 % dans le manifeste.
- Reprise à l'endroit où l'apprenant s'est arrêté (suspend_data).
- Hors LMS, le fichier `index.html` fonctionne seul (progression en localStorage).

## Reconstruire
```bash
pip install pillow
python3 src/build.py      # génère dist/scorm/index.html (images intégrées)
python3 src/package.py    # ajoute manifest + audios, produit dist/*.zip
```
Les textes et le contenu pédagogique sont dans `src/app.js` (items, quiz) ; la narration dans `src/narr.py` → `src/narr.json`.

## Régénérer la voix off
```bash
pip install sherpa-onnx numpy
# modèle : vits-piper-fr_FR-siwis-medium (k2-fsa/sherpa-onnx, release « tts-models »)
PIPER_MODEL_DIR=./vits-piper-fr_FR-siwis-medium python3 src/tts.py   # nécessite ffmpeg
```
Pour une voix humaine : remplacer les fichiers de `audio/` (mêmes noms), puis relancer `package.py`.

## Crédits
Voix synthétique : modèle Piper « siwis » (University of Edinburgh), licence CC BY 4.0.
