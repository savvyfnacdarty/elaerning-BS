import base64,io,glob,json,os,sys
from PIL import Image
import pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
SRC=ROOT/'src'
names=['s01_01','s01_02','s02_04','s03_05','s03_06','s09_13','s12_17','s13_19','s14_20','s15_23','s16_24','s17_26','s21_33','s30_39','s30_40','s31_42','s31_43','s32_47','s34_54','s34_55','s35_56','s37_58','s41_61','s41_63','s45_65','s45_66','s46_75','s46_78']
IMG={}
for n in names:
    im=Image.open(ROOT/'assets/photos'/(n+'.jpg')).convert('RGB'); im.thumbnail((620,620))
    b=io.BytesIO(); im.save(b,'JPEG',quality=74,optimize=True); IMG[n]='data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
lg=Image.open(ROOT/'assets/logo.png').convert('RGBA'); lg.thumbnail((330,330))
b=io.BytesIO(); lg.save(b,'PNG',optimize=True); IMG['logo']='data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
css=open(SRC/'style.css').read(); js=open(SRC/'app.js').read()
html=f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Installation électrique – Académie Fnac Darty</title>
<meta name="description" content="E-learning livreurs-installateurs : limites d'intervention sur l'installation électrique du client.">
<style>{css}</style></head><body>
<header><div class="hd"><img src="{IMG['logo']}" alt="Académie Fnac Darty"><h1>Installation électrique chez le client<small>Livreurs-installateurs · GEM &amp; TV · ≈ 18 min</small></h1><div class="pg" id="pg"></div></div><div class="chev"></div></header>
<div class="bar"><i></i></div>
<nav class="steps"><div class="in"></div></nav>
<div class="vo"><div class="in"><button class="vb" id="vplay">▶ Écouter</button><button class="vb g" id="vmute" aria-pressed="true">🔊 Voix off activée</button><details><summary>Transcription de la voix off</summary><p id="vtxt"></p></details></div></div>
<main id="app"></main>
<footer class="cr">Voix off synthétique : modèle Piper « siwis » (University of Edinburgh, licence CC BY 4.0) · Académie Fnac Darty</footer>
<script>const IMG={json.dumps(IMG)};const NARR={json.dumps(json.load(open(SRC/'narr.json')),ensure_ascii=False)};</script>
<script>{js}</script>
</body></html>'''
OUT=str(ROOT/'dist'/'scorm')+'/'
os.makedirs(OUT+'audio',exist_ok=True)
open(OUT+'index.html','w').write(html)
print(len(html)//1024,'KB')
