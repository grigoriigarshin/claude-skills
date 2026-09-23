# Google Workspace access

Reading Drive, Docs, Sheets and Slides through the local `gws` CLI, using the user's gcloud Application Default Credentials. No MCP server, no per-task OAuth.

Only needed when a project has a `Decks` or `Meeting notes` source.

## Token prelude

`GOOGLE_WORKSPACE_CLI_TOKEN` expires roughly hourly. Chain this into the **same** Bash invocation as the `gws` call, so the environment survives. On a 401 or 403, re-run it once and retry the same command.

```bash
export GCLOUD_SDK_ROOT=$(gcloud info --format="value(installation.sdk_root)")
export PYTHONPATH="$GCLOUD_SDK_ROOT/lib/third_party:$GCLOUD_SDK_ROOT/lib"
export GOOGLE_WORKSPACE_CLI_TOKEN=$(python3 -c "
import google.auth
from google.auth.transport.requests import Request
scopes = [
 'https://www.googleapis.com/auth/cloud-platform',
 'https://www.googleapis.com/auth/drive.readonly',
 'https://www.googleapis.com/auth/documents.readonly',
 'https://www.googleapis.com/auth/presentations.readonly',
 'https://www.googleapis.com/auth/spreadsheets.readonly',
]
creds, _ = google.auth.default(scopes=scopes)
if not creds.valid:
    creds.refresh(Request())
print(creds.token)
")
```

On `command not found: gws`, skip all Google sources, say so once, and tell the author to install it with `brew install googleworkspace-cli` plus gcloud auth setup.

## Commands

```bash
# Find a deck or doc by name, newest first
gws drive files list --params '{"q":"name contains '\''Inbox Revamp'\''","orderBy":"modifiedTime desc","fields":"files(id,name,mimeType,modifiedTime)"}'

# List a folder
gws drive files list --params '{"q":"'\''<folder_id>'\'' in parents and trashed=false","orderBy":"modifiedTime desc","fields":"files(id,name,mimeType,modifiedTime)"}'

gws slides presentations get --params '{"presentationId":"<id>"}'
gws docs documents get --params '{"documentId":"<id>"}'
gws sheets spreadsheets values get --params '{"spreadsheetId":"<id>","range":"Sheet1!A1:Z100"}'
```

## Never dump a deck

Slides responses are enormous. A real 123-slide deck returns megabytes of JSON. **Always pipe through an extractor** that prints only what you need.

```bash
gws slides presentations get --params '{"presentationId":"<id>"}' | python3 -c "
import sys, json
d = json.loads(sys.stdin.read())
slides = d.get('slides', [])
def text(elements):
    out = []
    for e in elements:
        for t in e.get('shape', {}).get('text', {}).get('textElements', []):
            r = t.get('textRun', {}).get('content', '')
            if r.strip():
                out.append(r.strip())
        if 'elementGroup' in e:
            out += text(e['elementGroup'].get('children', []))
    return out
print('TITLE:', d.get('title'), '| slides:', len(slides))
for i, s in enumerate(slides, 1):
    print(f'{i}:', ' | '.join(text(s.get('pageElements', [])))[:300])
"
```

Print titles first, find the section you need, then re-extract only those slides in full.

## Dated sections

Decks that are updated on a cadence carry dated cover slides. **Detect the order rather than assuming it.** One real deck descended newest-first: Sept 9, Jul 22, Jun 24, May 20. Others accumulate oldest-first.

Find the date-like strings, sort them, and cross-check the newest against the file's `modifiedTime`. If they agree, you have the section order right.

A deck with no dated sections is a living document. Fall back to `modifiedTime` for freshness and read only the most recent slides.

## Slide deep links

Link a slide by its `objectId`, which comes back with each slide:

```
https://docs.google.com/presentation/d/<presentationId>/edit#slide=id.<objectId>
```

**Never embed an image hosted by Google.** Those URLs are short-lived and authenticated, so they break wherever you paste them. Link the slide instead.
