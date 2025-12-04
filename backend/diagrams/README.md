npx# Diagrams

## Export ERD to SVG/PNG

Use Mermaid CLI to export the ERD from `erd.mmd`:

```powershell
# SVG
npx @mermaid-js/mermaid-cli -i .\backend\diagrams\erd.mmd -o .\backend\diagrams\erd.svg

# PNG
npx @mermaid-js/mermaid-cli -i .\backend\diagrams\erd.mmd -o .\backend\diagrams\erd.png
```

If `npx` asks to install, confirm when prompted. The output files will be saved next to the source.

## VS Code Preview
You can also preview Mermaid diagrams using a VS Code extension like "Markdown Preview Mermaid Support" if desired.
