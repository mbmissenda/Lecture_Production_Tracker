# Lecture Production Tracker

A lightweight, static production control board for ISCI-630a complementary health lectures.

## Files

- `index.html` — semantic application structure
- `styles.css` — responsive and accessible visual design
- `config.js` — chapter list, workflow checklist, dependencies, work types, and queues
- `app.js` — progress logic, recommendations, filters, localStorage, and backup/restore

## Progress calculation

Progress is the number of completed checklist items divided by the 21 checklist items for each lecture. Every item has equal weight. The detail view always shows both the percentage and the exact checklist count.

The PDF branch is tracked separately from the primary stage sequence. Once the accessible PowerPoint is complete, recording and PDF export can both appear as available next actions.

Dependencies guide recommendations only. They never disable checklist controls.

## Initial course inventory

The initial configuration contains the 14 required chapters listed in the course readings. Optional Chapter 27 is not included. Chapters 1, 2, and 5 begin complete. Chapter 24 begins with its source, narrative script, and PowerPoint recorded as complete; its human reviews, images, accessibility, recording, PDF, transcript, and CourseArc work remain open.

## File naming

Use a two-digit chapter number and a short readable topic:

- `Chapter_24_Herbalism_Lecture.pptx`
- `Chapter_24_Herbalism_Student.pdf`
- `Chapter_24_Herbalism_Final.mp4`
- `Chapter_24_Herbalism_Transcript.docx`

## Data and backups

Tracker changes save automatically in the browser's localStorage. Data is specific to the browser and device being used.

Use **Export backup** regularly to download a readable JSON backup. **Import backup** validates the selected file and requests confirmation before replacing current browser data.

## Publish with GitHub Pages

1. Create a repository named `lecture-production-tracker`.
2. Add these five files at the repository root and push them to the default branch.
3. In **Settings → Pages**, choose **Deploy from a branch**, select the default branch and `/ (root)`, then save.

No build step, server, database, authentication, or external service is required.
