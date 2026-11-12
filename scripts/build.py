import os
from pathlib import Path
import shutil
from zipfile import ZIP_DEFLATED, ZipFile


root = Path(__file__).resolve().parent.parent
site = root / "site"
projects = root / "projects"
dist = root / "dist"
ignored = {".git", ".angular", "node_modules", "bin", "obj", "dist", "dados", "coverage", "TestResults"}
extensions = {".cs", ".csproj", ".json", ".http", ".mjs", ".ts", ".html", ".css", ".md"}

if not (site / "index.html").is_file():
    raise SystemExit("O arquivo site/index.html está ausente.")
if not (projects / "README.md").is_file():
    raise SystemExit("O arquivo projects/README.md está ausente.")

shutil.copytree(site, dist, dirs_exist_ok=True)
archive_path = dist / "Sprint Web - Projetos.zip"
with ZipFile(archive_path, "w", ZIP_DEFLATED) as archive:
    for folder, directories, filenames in os.walk(projects):
        directories[:] = sorted(directory for directory in directories if directory not in ignored)
        for name in sorted(filenames):
            file = Path(folder) / name
            if file.is_symlink() or (file.suffix not in extensions and name != ".gitignore"):
                continue
            relative = file.relative_to(projects)
            archive.write(file, (Path("Sprint Web - Projetos") / relative).as_posix())

print(f"Site pronto em {dist}")
