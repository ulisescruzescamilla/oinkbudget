# OinkBudget — project rules

- Never place two or more buttons side by side in the same row. Stack actions vertically (primary first, secondary/destructive below as a quieter text button). Only exception: the Gasto / Ingreso quick-capture buttons on Home.
- Destructive actions (delete) always go through the shared `askConfirm()` modal (src/ui.jsx).
