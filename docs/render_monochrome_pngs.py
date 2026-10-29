import os
import subprocess
from pathlib import Path

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DOCS_DIR = Path(r"c:\Users\deore\Desktop\Final Project 3d model\docs")

diagrams = [
    ("fig1_workflow.svg", "fig1_workflow.png", 920, 390),
    ("system_architecture.svg", "system_architecture.png", 1100, 820),
    ("fig3_sequence.svg", "fig3_sequence.png", 940, 520),
    ("fig4_scalability.svg", "fig4_scalability.png", 940, 330),
]

for svg_name, png_name, w, h in diagrams:
    svg_path = DOCS_DIR / svg_name
    png_path = DOCS_DIR / png_name
    
    # Create HTML wrapper for crisp high-DPI rendering
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ background: #ffffff; width: {w}px; height: {h}px; overflow: hidden; }}
  img {{ width: {w}px; height: {h}px; display: block; }}
</style>
</head>
<body>
  <img src="{svg_path.as_uri()}"/>
</body>
</html>"""
    temp_html = DOCS_DIR / f"temp_{svg_name}.html"
    temp_html.write_text(html_content, encoding="utf-8")
    
    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--window-size={w},{h}",
        f"--screenshot={str(png_path)}",
        temp_html.as_uri()
    ]
    print(f"Rendering {svg_name} -> {png_name}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if temp_html.exists():
        temp_html.unlink()
    print(f"Finished {png_name}: size={png_path.stat().st_size if png_path.exists() else 0} bytes")

print("All diagrams rendered successfully.")
