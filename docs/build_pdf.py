import subprocess
from pathlib import Path

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
HTML_FILE = Path(r"c:\Users\deore\Desktop\Final Project 3d model\docs\paper_ieee.html")
PDF_FILE = Path(r"c:\Users\deore\Desktop\Final Project 3d model\docs\RESEARCH_PAPER_IEEE.pdf")

cmd = [
    CHROME,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={str(PDF_FILE)}",
    HTML_FILE.as_uri()
]

print(f"Generating PDF from {HTML_FILE} -> {PDF_FILE}...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)
if PDF_FILE.exists():
    print(f"Successfully generated PDF: {PDF_FILE.stat().st_size} bytes")
else:
    print("Error: PDF not found. Stderr:", res.stderr)
