# Build a single self-contained HTML file (fonts inlined, no install/offline extras).
import base64,re,sys,os
site=sys.argv[1]; out=sys.argv[2]
s=open(os.path.join(site,"index.html")).read()
s=re.sub(r"<!--PWA-->.*?<!--/PWA-->\n?","",s,flags=re.S)
def font(m):
    p=os.path.join(site,m.group(1)); b=base64.b64encode(open(p,"rb").read()).decode()
    return f'url(data:font/woff2;base64,{b})'
s=re.sub(r'url\((fonts/[^)]+\.woff2)\)',font,s)
ic=base64.b64encode(open(os.path.join(site,"icons/icon-32.png"),"rb").read()).decode()
s=s.replace("</title>",f'</title>\n<link rel="icon" href="data:image/png;base64,{ic}">',1)
open(out,"w").write(s); print("single-file bytes:",len(s))
