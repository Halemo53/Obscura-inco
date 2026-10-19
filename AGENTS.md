<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- AI features call Lovable AI Gateway from server routes under src/routes/api with helpers in src/lib/ai/*.server.ts; only audit metadata is sent to the model, never encrypted values. Why: keeps the key server-side and preserves confidentiality.
