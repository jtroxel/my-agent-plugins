---
name: git-worktrees
description: >-
  Manages Git worktrees using a bare clone as the hub (`*-wt/_bare/`) with sibling
  checkouts prefixed by project name. Use for bare repos, Git worktrees, or
  multi-branch working layouts.
---
# Git worktrees

Use this skill when maintaining multiple checkouts of one Git repository without
duplicating `.git` directories.

## Directory model

*Structure under an arbitrary project root dir:*

```text
<project>-<default> -> wt/<project>-<default>
<user-defined> -> wt/<user-defined>
wt/
├── _bare/
├── <project>-default/
└── <project>-<branch-slug>/
```


| Path                               | Role                                             |
| ---------------------------------- | ------------------------------------------------ |
| `<project>-<default>`                        | Symlink to worktree for the default branch on the remote (e.g.: `main`). |
| symlinks*                        | Convenience symlinks to the default worktree.  Created manually by user or using this skill.  |
| `wt/_bare/`              | Bare clone and single Git object store.          |
| `wt/<project>-default/`  | Linked default-branch worktree.                  |
| `wt/<user-defined>/` | Additional worktrees, requested and named by the user using this skill. |

## Operating rules

1. Use `git -C wt/_bare` for `worktree`, `fetch`, and branch control
   commands.
2. Keep remotes on the bare repository. Conventionally `origin` is the working
   fork and `upstream` is the source project.
3. Add worktrees as siblings of `_bare`, named with the project prefix.
4. Keep the root symlink pointed at the default worktree.

## Initial setup

```sh
git clone --bare <repository-url> wt/_bare
git -C wt/_bare worktree add ../<project>-default main
ln -s wt/<project>-default <project>
```

Confirm the repository's default branch before substituting `main`.

## Common operations

```sh
# Fetch and prune using the bare control plane.
git -C wt/_bare fetch origin
git -C wt/_bare worktree prune

# Create and add a branch worktree.
git -C wt/_bare branch my-feature main
git -C wt/_bare worktree add ../<project>-my-feature my-feature

# Remove the linked worktree, then optionally remove its branch.
git -C wt/_bare worktree remove ../<project>-my-feature
git -C wt/_bare branch -d my-feature

# Push a branch.
git -C wt/_bare push -u origin my-feature
```

## Notes

- Use `git -C wt/_bare fetch upstream <branch>` for an upstream line.
- A shallow fetch can reduce disk use, but rebasing onto older commits may require
  a deeper fetch.
- Branch names and remote names are repository-specific; inspect existing remotes
  and project documentation before making assumptions.
