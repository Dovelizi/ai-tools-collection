---
name: remio
description: Use when an agent needs to search or ask questions over the user's Remio personal knowledge base, read supported local files through Remio, or create/update Remio notes.
---

# Remio Agent Skill

Remio is a local-first AI memory and personal knowledge base desktop app. It parses files, webpages, recordings, emails, messages, images, and notes into local indexes and vectors so agents can retrieve focused personal context instead of repeatedly scanning directories, grepping files, or loading whole documents into prompts.

## Requirement

This skill is an interface to the Remio desktop client. It is not a standalone memory backend.

Before using the CLI, make sure the Remio desktop app is installed and running. If Remio is missing, open:

```text
https://remio.ai/
```

## Core Commands

Search the local knowledge base:

```bash
remio search_notes --query "<query>"
```

Ask a RAG question over Remio:

```bash
remio rag "<question>"
```

Read a note by ID:

```bash
remio read_note <noteId>
```

Parse a supported local file through Remio:

```bash
remio read_file <absolute-path>
```

Create or update a note:

```bash
remio create_note
remio update_note <noteId>
```

## When To Use

- The user asks about their own notes, files, emails, meetings, Slack messages, or saved webpages.
- The agent needs context from personal or work materials before drafting, coding, planning, or answering.
- The task involves supported office, audio, or video files and a clean parsed/transcribed representation is more useful than raw file reads.

## Notes

- Prefer Remio retrieval before broad local folder scans when the information may already be indexed.
- For agent workflows, retrieve focused context first, then pass only the relevant excerpts into the model.
- If a CLI command fails because the app is not running, ask the user to open Remio and retry.
