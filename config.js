/*
 * Lecture and workflow configuration.
 * Edit this file when chapters or production steps change.
 */

const TRACKER_CONFIG = {
  version: 1,
  storageKey: "lecture-production-tracker-v1",
  stages: [
    "Not Started",
    "Script",
    "PowerPoint",
    "Images",
    "Accessibility",
    "Ready to Record",
    "Video Production",
    "Transcript",
    "CourseArc",
    "Complete"
  ],
  workTypes: [
    "High concentration",
    "Visual/creative",
    "Accessibility",
    "Recording",
    "Video editing",
    "Transcript editing",
    "Administrative"
  ],
  groups: [
    { id: "content", label: "Content Development" },
    { id: "visual", label: "Visual Development" },
    { id: "accessibility", label: "Accessibility" },
    { id: "video", label: "Recording and Video Production" },
    { id: "pdf", label: "Student PDF" },
    { id: "publishing", label: "Video Publishing and Transcript" },
    { id: "coursearc", label: "CourseArc" }
  ],
  checklist: [
    { id: "chapter_uploaded", label: "Chapter uploaded to ChatGPT Work", group: "content", action: "Upload chapter to ChatGPT Work", workType: "Administrative", prerequisites: [] },
    { id: "script_generated", label: "Narrative script generated", group: "content", action: "Generate narrative script", workType: "High concentration", prerequisites: ["chapter_uploaded"] },
    { id: "script_reviewed", label: "Script reviewed and revised", group: "content", action: "Review script", workType: "High concentration", prerequisites: ["script_generated"] },
    { id: "powerpoint_generated", label: "PowerPoint generated", group: "content", action: "Generate PowerPoint", workType: "High concentration", prerequisites: ["script_reviewed"] },
    { id: "powerpoint_reviewed", label: "PowerPoint content, sequencing, and design reviewed", group: "content", action: "Review PowerPoint", workType: "High concentration", prerequisites: ["powerpoint_generated"] },

    { id: "images_sourced", label: "Images sourced or generated", group: "visual", action: "Source or create images", workType: "Visual/creative", prerequisites: ["powerpoint_reviewed"] },
    { id: "visual_design_complete", label: "Images inserted and final visual design completed", group: "visual", action: "Complete visual design", workType: "Visual/creative", prerequisites: ["images_sourced"] },

    { id: "ppt_accessibility", label: "PowerPoint accessibility review completed", group: "accessibility", action: "Complete PowerPoint accessibility review", workType: "Accessibility", prerequisites: ["visual_design_complete"] },

    { id: "voice_over", label: "Voice over presentation", group: "video", action: "Voice over presentation", workType: "Recording", prerequisites: ["ppt_accessibility"] },
    { id: "video_edited", label: "Trim, review, and edit video", group: "video", action: "Trim, review, and edit video", workType: "Video editing", prerequisites: ["voice_over"] },

    { id: "pdf_exported", label: "Final presentation exported to PDF", group: "pdf", action: "Export student PDF", workType: "Administrative", prerequisites: ["ppt_accessibility"] },
    { id: "pdf_accessibility", label: "PDF accessibility checked", group: "pdf", action: "Check PDF accessibility", workType: "Accessibility", prerequisites: ["pdf_exported"] },

    { id: "vimeo_uploaded", label: "Final video uploaded to Vimeo", group: "publishing", action: "Upload video to Vimeo", workType: "Administrative", prerequisites: ["video_edited"] },
    { id: "clipchamp_uploaded", label: "Final video uploaded to Clipchamp", group: "publishing", action: "Upload video to Clipchamp", workType: "Administrative", prerequisites: ["video_edited"] },
    { id: "transcript_generated", label: "Transcript generated", group: "publishing", action: "Generate transcript from the recorded lecture", workType: "Transcript editing", prerequisites: ["clipchamp_uploaded"] },
    { id: "transcript_finalized", label: "Transcript edited and finalized", group: "publishing", action: "Edit transcript", workType: "Transcript editing", prerequisites: ["transcript_generated"] },

    { id: "coursearc_vimeo", label: "Vimeo video added to CourseArc", group: "coursearc", action: "Add Vimeo video to CourseArc", workType: "Administrative", prerequisites: ["vimeo_uploaded", "transcript_finalized", "pdf_accessibility"] },
    { id: "coursearc_transcript", label: "Transcript added to CourseArc", group: "coursearc", action: "Add transcript to CourseArc", workType: "Administrative", prerequisites: ["vimeo_uploaded", "transcript_finalized", "pdf_accessibility"] },
    { id: "coursearc_pdf", label: "Student PDF added to CourseArc", group: "coursearc", action: "Add student PDF to CourseArc", workType: "Administrative", prerequisites: ["vimeo_uploaded", "transcript_finalized", "pdf_accessibility"] },
    { id: "coursearc_reviewed", label: "Final CourseArc page reviewed", group: "coursearc", action: "Review CourseArc page", workType: "Administrative", prerequisites: ["coursearc_vimeo", "coursearc_transcript", "coursearc_pdf"] },
    { id: "lecture_complete", label: "Lecture complete", group: "coursearc", action: "Mark lecture complete", workType: "Administrative", prerequisites: ["coursearc_reviewed"] }
  ],
  chapters: [
    { number: 1, title: "Characteristics of Complementary and Alternative Medicine", module: "Module 1", status: "complete" },
    { number: 2, title: "Translation from Conventional Medicine", module: "Module 1", status: "complete" },
    { number: 5, title: "Social and Cultural Factors in Medicine", module: "Modules 1, 7, and 8", status: "complete" },
    { number: 10, title: "Mind-Body Therapies, Stress, and Psychometrics", module: "Module 4", status: "not-started" },
    { number: 11, title: "Prayer, Religion, and Spirituality", module: "Module 4", status: "not-started" },
    { number: 14, title: "Energy Medicine", module: "Module 5", status: "not-started" },
    { number: 17, title: "Massage, Bodywork, and Touch Therapy", module: "Modules 5 and 6", status: "not-started" },
    { number: 18, title: "Osteopathy", module: "Module 6", status: "not-started" },
    { number: 19, title: "Chiropractic", module: "Module 6", status: "not-started" },
    { number: 21, title: "Yoga", module: "Module 4", status: "not-started" },
    { number: 23, title: "Contemporary Naturopathic Medicine", module: "Module 7", status: "not-started" },
    { number: 24, title: "Ethnobotany and Western Herbalism", module: "Module 3", status: "chapter-24" },
    { number: 28, title: "Traditional Medicine of China and East Asia", module: "Module 7", status: "not-started" },
    { number: 29, title: "Classical Acupuncture", module: "Module 7", status: "not-started" }
  ],
  queues: [
    { id: "all", label: "All lectures" },
    { id: "script", label: "Needs script/content work" },
    { id: "powerpoint", label: "Needs PowerPoint review" },
    { id: "images", label: "Needs images" },
    { id: "accessibility", label: "Needs accessibility review" },
    { id: "record", label: "Ready to record" },
    { id: "video", label: "Needs video editing" },
    { id: "uploads", label: "Needs Vimeo/Clipchamp upload" },
    { id: "transcript", label: "Needs transcript work" },
    { id: "pdf", label: "Needs PDF work" },
    { id: "coursearc", label: "Ready for CourseArc" },
    { id: "revision", label: "Needs revision" },
    { id: "complete", label: "Complete" }
  ]
};
