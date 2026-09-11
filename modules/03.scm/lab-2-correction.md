# Git/GitHub Lab — Collaboration with 2 Users

## Objectives

Both Students (User A and User B) will be able to:
- Work each on their own branch without overwriting the other's work
- Sync up using `rebase` instead of piling up merge commits
- Deliberately trigger a conflict, understand it, and resolve it cleanly
- Use `git revert` to undo a commit that has already been shared
- Use `git reset` (soft / mixed / hard) and understand why it's dangerous on a shared branch
Estimated duration: 2 hours.

## Prerequisites

- Git installed locally for both participants
- A GitHub account for each participant
- A code editor (VS Code recommended, to easily visualize conflicts)
---

## Part 0 — Setting up the repository

**User A**:
1. Create a GitHub repo `git-lab-collab` (private)
2. Add **User B** as a collaborator (Settings → Collaborators → Write access)
3. Create a `recipe.md` file with the following starting content, committed directly to `main`:
```markdown
# Recipe: Chocolate Cake

## Ingredients
1. 200g dark chocolate
2. 150g butter
3. 150g sugar
4. 3 eggs
5. 100g flour

## Steps
1. Preheat the oven to 180°C
2. Melt the chocolate and butter
3. Mix the sugar and eggs
4. Add the melted chocolate then the flour
5. Bake for 20 minutes
```

**User A and User B**:
```bash
git clone <repo-url>
cd git-lab-collab
```

We deliberately use a simple text file: conflicts are easy to trigger and easy to read.

Up to you to use different file names, structure, and content.

---

## Part 1 — Working in parallel without stepping on each other

Each person works on a **DIFFERENT AREA** of the file, to verify that the merge goes smoothly.

**User A** — adds prep time info:

```bash
git checkout -b feature/prep-time
```
Edit the file to add a line under the title:
```markdown
# Recipe: Chocolate Cake
*Prep time: 15 minutes*
```
```bash
git add recipe.md
git commit -m "Add prep time"
git push -u origin feature/prep-time
```
→ Open a Pull Request on GitHub.

**User B** — adds an allergen note at the bottom of the file:
```bash
git checkout main
git pull
git checkout -b feature/allergens
```
Add at the end of the file:
```markdown
## Allergens
Contains: gluten, eggs, dairy
```
```bash
git add recipe.md
git commit -m "Add allergens section"
git push -u origin feature/allergens
```
→ Open a second Pull Request.

**Both together**: merge both PRs on GitHub (User A merges the first one, User B merges the second). Since the modified areas don't overlap, **no conflict** should appear. This is the baseline behavior to observe before breaking things on purpose.

---

## Part 2 — Staying in sync with `rebase`

Goal: avoid branches drifting too far from `main`, and keep a linear history.

**User A**:
```bash
git checkout main
git pull
git checkout -b feature/double-quantities
```
Edit the ingredients list (double the quantities), commit locally (don't push yet).

**User B**, meanwhile, merges another PR into `main` (for example, adding a step "Let cool for 10 minutes").

**User A**, before pushing their branch, updates first:
```bash
git fetch origin
git rebase origin/main
```
- If there's no conflict: Git simply replays User A's commit on top of the new `main`.
- Then push with:
```bash
git push origin feature/double-quantities
```
(no need for `--force` since it's the first time this branch is pushed)

**Point worth explaining**: `rebase` rewrites the local branch's history. If the branch had already been pushed and someone else was using it, you'd need `git push --force-with-lease` — never do this on a shared branch without warning others first.

---

## Part 3 — Triggering and resolving a conflict

Here we deliberately force both users to edit **the exact same line**.

**Both, at the same time, start from an up-to-date `main`**:
```bash
git checkout main
git pull
git checkout -b feature/baking-time-A   # (User A)
git checkout -b feature/baking-time-B   # (User B)
```

Both edit the same line of the file, but differently:

- User A changes `4. Bake for 20 minutes` to `4. Bake for 20 minutes at 180°C`
- User B changes `4. Bake for 20 minutes` to `4. Bake for 25 minutes with fan-assisted heat`
Each commits and pushes their branch:
```bash
git add recipe.md
git commit -m "Clarify baking time"
git push -u origin feature/baking-time-A   # or -B
```

**User A** opens a PR and merges it first → no problem, it's the first change to `main`.

**User B** tries to update their branch:
```bash
git fetch origin
git rebase origin/main
```

**Conflict!** Git shows:
```
CONFLICT (content): Merge conflict in recipe.md
```

The file now contains:
```
<<<<<<< HEAD
4. Bake for 25 minutes with fan-assisted heat
=======
4. Bake for 20 minutes at 180°C
>>>>>>> origin/main
```

**Manual resolution**:
1. Open `recipe.md` in the editor
2. Decide together on the final version, for example:
   `4. Bake for 20-25 minutes at 180°C with fan-assisted heat`
3. Remove the `<<<<<<<`, `=======`, `>>>>>>>` markers
4. Mark it as resolved:
```bash
git add recipe.md
git rebase --continue
```
5. Push (required here since the branch history was rewritten):
```bash
git push --force-with-lease origin feature/baking-time-B
```
6. Merge the PR on GitHub.
**Variant to try**: redo the same conflict scenario but resolve it with `git merge origin/main` instead of `rebase`, to compare:
- `merge` creates an extra merge commit and keeps history as-is
- `rebase` rewrites history so it looks linear
**Bonus variant**: resolve a conflict directly in GitHub's conflict editor (on the Pull Request page, "Resolve conflicts" button) instead of locally.

---

## Part 4 — `git revert`

Goal: undo a change that's already been merged into `main`, without rewriting shared history.

**User A**:
```bash
git checkout main
git pull
git checkout -b feature/ingredients-error
```
Deliberately introduce an error, for example changing `150g sugar` to `500g sugar`.
```bash
git add recipe.md
git commit -m "Fix sugar quantity (deliberate error)"
git push -u origin feature/ingredients-error
```
→ Open and merge the PR into `main`.

**User B** spots the error and reverts it cleanly:
```bash
git checkout main
git pull
git log --oneline    # find the hash of the faulty commit
git revert <commit-hash>
```
Git opens a pre-filled commit message (`Revert "Fix sugar quantity..."`) → confirm it.
```bash
git push
```

**Point to observe**: unlike `reset`, `revert` **adds** a new commit that undoes the changes, without deleting history. This is the preferred method on a shared branch like `main`.

**Bonus**: try `git revert` on a **merge commit** (requires the `-m 1` option) to see the difference:
```bash
git revert -m 1 <merge-commit-hash>
```

---

## Part 5 — `git reset` (soft / mixed / hard)

Only do this on a **local test branch**, never directly on `main`.

**User A** (or B, each can do it on their own):
```bash
git checkout -b test-reset
```
Make 3 dummy commits in a row, for example adding a line each time:
```bash
echo "Note 1" >> notes.md && git add notes.md && git commit -m "Commit 1"
echo "Note 2" >> notes.md && git add notes.md && git commit -m "Commit 2"
echo "Note 3" >> notes.md && git add notes.md && git commit -m "Commit 3"
git log --oneline
```

**Test `--soft`**: go back 1 commit while keeping the changes *staged* (ready to commit):
```bash
git reset --soft HEAD~1
git status   # Commit 3's changes are staged
```

**Test `--mixed`** (default behavior): go back while keeping the changes but *unstaged*:
```bash
git reset HEAD~1
git status   # the changes are present but not yet added to the index
```

**Test `--hard`**: go back while **permanently deleting** the changes:
```bash
git reset --hard HEAD~1
git status   # nothing to commit, the changes are gone
```

**Discussion to have with both participants**:
- What happens if you run `git reset --hard` on a commit that's **already been pushed** to GitHub? (you'd need to force with `git push --force`, which can overwrite the other person's work)
- Why is `revert` safer than `reset --hard` once a commit is shared with someone else? It keeps the commit history intact, while `reset --hard` rewrites it and erase the changes.

To go further, reproduce the risky situation: User A does a `reset --hard` on a branch that's already been pushed, tries to `push`, gets rejected (`rejected — non-fast-forward`), and has to understand why Git protects against this before using `--force-with-lease` knowingly.

---

## Summary Table

| Command | Effect | Safe on a shared branch? |
|---|---|---|
| `git merge` | Creates a merge commit, keeps the full history | Yes |
| `git rebase` | Rewrites history to make it linear | Only on a branch that's local to you |
| `git revert <hash>` | Adds a commit that undoes an existing commit | Yes, recommended |
| `git reset --soft` | Moves HEAD, keeps changes staged | Local only |
| `git reset --mixed` | Moves HEAD, keeps changes unstaged | Local only |
| `git reset --hard` | Moves HEAD, deletes the changes | Never if already pushed |

## Best Practices to Remember

- Always `git pull` (or `fetch` + `rebase`) before starting a new branch
- One branch = one feature, with small and clear commits
- Communicate before any `push --force`
- Use `revert` to undo shared history, `reset` to clean up **local** history
## Going Further (bonus)

- Try `git rebase -i` to reorder/squash commits before pushing them
