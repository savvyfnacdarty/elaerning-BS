import os,shutil,zipfile,glob
from xml.dom import minidom
import pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
P=str(ROOT/'dist'/'scorm')+'/'
for f in glob.glob(P+'audio/*'):os.remove(f)
for f in glob.glob(str(ROOT/'audio'/'*.mp3')):shutil.copy(f,P+'audio/')
files=['index.html']+['audio/'+os.path.basename(f) for f in sorted(glob.glob(P+'audio/*.mp3'))]
fl=''.join(f'      <file href="{f}"/>\n' for f in files)
m=f'''<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="FD_ACADEMIE_INSTALLATION_ELECTRIQUE" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG1">
    <organization identifier="ORG1">
      <title>Installation électrique chez le client – Livreurs-installateurs</title>
      <item identifier="ITEM1" identifierref="RES1" isvisible="true">
        <title>Installation électrique chez le client</title>
        <adlcp:masteryscore>80</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES1" type="webcontent" adlcp:scormtype="sco" href="index.html">
{fl}    </resource>
  </resources>
</manifest>
'''
open(P+'imsmanifest.xml','w',encoding='utf-8').write(m)
minidom.parse(P+'imsmanifest.xml')
Z=str(ROOT/'dist'/'Module_SCORM12_installation_electrique.zip')
if os.path.exists(Z):os.remove(Z)
with zipfile.ZipFile(Z,'w',zipfile.ZIP_DEFLATED) as z:
    z.write(P+'imsmanifest.xml','imsmanifest.xml')   # manifest à la racine
    for f in files:z.write(P+f,f)
print(os.path.getsize(Z)//1024,'KB',len(files),'fichiers')
