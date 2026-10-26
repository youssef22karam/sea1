#!/usr/bin/env python3
"""Rebuild the original single-file HTML from the split parts.
Usage: python3 build.py [output.html]   (default: sea-single.html)"""
import re, sys, glob
rd=lambda p: open(p,encoding="utf-8",newline="").read()
idx=rd("index.html")
j=lambda pre:"".join(rd(f) for f in sorted(glob.glob(pre+"-*.js")))
T='<script type="module">'
block=T+j("boat")+'</script>\n'+T+j("sea")+'</script>'
out=re.sub(r"<!--LOADER-START-->.*?<!--LOADER-END-->",lambda m:block,idx,flags=re.S)
open(sys.argv[1] if len(sys.argv)>1 else "sea-single.html","w",encoding="utf-8",newline="").write(out)
print("built",len(out.encode()),"bytes")
