# PSD_SRC Folder

Pretty much AI-Generated scripts to convert original .PSD ALIVE scene files to webp+json descriptor. to use:

copy the PSD assets to folder using this hierarchy:

- BG
- Calendar
- CG
- Cutscenes
- Portraits
- UI

run:
```bash
npm i
node convert.js

pip install -r requirements.txt
python update_dimensions.py
python add_portrait_padding.py
python convert_to_webp.py
```
