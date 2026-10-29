import shutil
from pathlib import Path

SRC_DIR = Path(r"c:\Users\deore\Desktop\Final Project 3d model\docs")
DEST_DIR = Path(r"C:\Users\deore\.gemini\antigravity\brain\b2284181-1392-48dc-b45c-294e7ab52aed")

files_to_copy = [
    ("fig1_workflow.svg", "fig1_workflow.svg"),
    ("fig1_workflow.png", "fig1_workflow.png"),
    ("system_architecture.svg", "system_architecture.svg"),
    ("system_architecture.png", "system_architecture.png"),
    ("fig3_sequence.svg", "fig3_sequence.svg"),
    ("fig3_sequence.png", "fig3_sequence.png"),
    ("fig4_scalability.svg", "fig4_scalability.svg"),
    ("fig4_scalability.png", "fig4_scalability.png"),
    ("RESEARCH_PAPER_IEEE.pdf", "RESEARCH_PAPER_IEEE.pdf"),
    ("RESEARCH_PAPER_IEEE.docx", "RESEARCH_PAPER_IEEE.docx"),
    ("RESEARCH_PAPER_IEEE.md", "research_paper_ieee.md"),
]

for src_name, dest_name in files_to_copy:
    src_file = SRC_DIR / src_name
    dest_file = DEST_DIR / dest_name
    if src_file.exists():
        shutil.copy2(src_file, dest_file)
        print(f"Copied {src_name} -> {dest_name} ({dest_file.stat().st_size} bytes)")
    else:
        print(f"Warning: {src_name} does not exist!")

print("Sync completed.")
