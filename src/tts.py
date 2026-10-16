import sherpa_onnx,json,re,subprocess,os,wave,numpy as np
d=os.environ.get('PIPER_MODEL_DIR','./vits-piper-fr_FR-siwis-medium')+'/'
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=d+'fr_FR-siwis-medium.onnx',tokens=d+'tokens.txt',data_dir=d+'espeak-ng-data'),num_threads=4))
tts=sherpa_onnx.OfflineTts(cfg)
import pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
N=json.load(open(ROOT/'src/narr.json'))
os.makedirs(ROOT/'audio',exist_ok=True)
def prep(t):
    for a,b in [('V.A.T.','vé a té'),('B.S.','bé esse'),('N.F.C.','ène èf cé'),('TEST','test'),('Wago','Vago'),(' : ',', '),('« ',''),(' »','')]:
        t=t.replace(a,b)
    return t
tot=0
for k,v in N.items():
    a=tts.generate(prep(v),sid=0,speed=0.95)
    s=np.array(a.samples);pad=np.zeros(int(a.sample_rate*0.25))
    s=np.concatenate([s,pad])
    w=wave.open('/tmp/tts/x.wav','wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(a.sample_rate);w.writeframes((s*32767).astype('int16').tobytes());w.close()
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i','/tmp/tts/x.wav','-ac','1','-b:a','48k','-codec:a','libmp3lame',str(ROOT/'audio'/f'{k}.mp3')],check=True)
    tot+=len(s)/a.sample_rate
print('durée totale',round(tot/60,1),'min')
