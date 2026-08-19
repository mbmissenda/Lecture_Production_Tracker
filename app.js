(function () {
  "use strict";

  const config = TRACKER_CONFIG;
  const checklistIds = config.checklist.map((item) => item.id);
  const totalChecklistItems = checklistIds.length;
  let state = loadState();
  let activeQueue = "all";
  let activeWorkType = "all";
  let activeChapterId = null;
  let statusTimer = null;

  const elements = {
    summaryStats: document.querySelector("#summary-stats"),
    courseProgress: document.querySelector("#course-progress"),
    queueControls: document.querySelector("#queue-controls"),
    workTypeFilter: document.querySelector("#work-type-filter"),
    filterDescription: document.querySelector("#filter-description"),
    hideCompleted: document.querySelector("#hide-completed"),
    chapterList: document.querySelector("#chapter-list"),
    resultCount: document.querySelector("#result-count"),
    emptyState: document.querySelector("#empty-state"),
    dialog: document.querySelector("#chapter-dialog"),
    chapterDetail: document.querySelector("#chapter-detail"),
    exportButton: document.querySelector("#export-button"),
    importButton: document.querySelector("#import-button"),
    importFile: document.querySelector("#import-file"),
    statusMessage: document.querySelector("#status-message")
  };

  initializeControls();
  bindEvents();
  render();

  function createInitialState() {
    const now = new Date().toISOString();
    return {
      version: config.version,
      chapters: config.chapters.map((chapter) => {
        const complete = chapter.status === "complete";
        const checklist = Object.fromEntries(checklistIds.map((id) => [id, complete]));

        if (chapter.status === "chapter-24") {
          checklist.chapter_uploaded = true;
          checklist.script_generated = true;
          checklist.powerpoint_generated = true;
        }

        const assets = {
          powerpoint: "",
          pdf: "",
          video: "",
          transcript: "",
          vimeo: "",
          coursearc: ""
        };

        if (chapter.number === 1) {
          assets.powerpoint = "C:\\Users\\mmiss\\OneDrive\\Desktop\\Complementary Health Lecture Production\\Chapter 01 - Characteristics of Complementary and Alternative Medicine\\PowerPoint\\Chapter_01_Characteristics_of_CAM_Lecture.pptx";
        }
        if (chapter.number === 5) {
          assets.powerpoint = "C:\\Users\\mmiss\\OneDrive\\Desktop\\Complementary Health Lecture Production\\Chapter 05 - Social and Cultural Factors in Medicine\\PowerPoint\\Chapter_05_Health_Care_as_Culture_Lecture.pptx";
        }
        if (chapter.number === 24) {
          assets.powerpoint = "C:\\Users\\mmiss\\Documents\\Codex\\2026-08-18\\you-are-designing-educational-slides-for-2\\outputs\\herbalism-plants-people-medicine.pptx";
        }

        return {
          id: `chapter-${String(chapter.number).padStart(2, "0")}`,
          number: chapter.number,
          title: chapter.title,
          module: chapter.module,
          checklist,
          needsRevision: false,
          revisionNote: "",
          notes: chapter.number === 24
            ? "Working PowerPoint exists but has not been consolidated. Image areas remain intentionally blank; human review and downstream production are not yet confirmed."
            : "",
          assets,
          lastUpdated: now
        };
      })
    };
  }

  function loadState() {
    const raw = localStorage.getItem(config.storageKey);
    if (!raw) return createInitialState();
    try {
      const parsed = JSON.parse(raw);
      return validateBackup(parsed).valid ? parsed : createInitialState();
    } catch (error) {
      return createInitialState();
    }
  }

  function saveState(chapter) {
    if (chapter) chapter.lastUpdated = new Date().toISOString();
    localStorage.setItem(config.storageKey, JSON.stringify(state));
  }

  function initializeControls() {
    elements.workTypeFilter.innerHTML = [
      '<option value="all">All work types</option>',
      ...config.workTypes.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`)
    ].join("");
  }

  function bindEvents() {
    elements.hideCompleted.addEventListener("change", render);
    elements.workTypeFilter.addEventListener("change", () => {
      activeWorkType = elements.workTypeFilter.value;
      render();
    });

    elements.queueControls.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-queue]");
      if (!button) return;
      activeQueue = button.dataset.queue;
      render();
    });

    elements.chapterList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-chapter-id]");
      if (!button) return;
      openChapter(button.dataset.chapterId);
    });

    elements.chapterDetail.addEventListener("change", handleDetailChange);
    elements.chapterDetail.addEventListener("input", handleDetailInput);
    elements.exportButton.addEventListener("click", exportBackup);
    elements.importButton.addEventListener("click", () => elements.importFile.click());
    elements.importFile.addEventListener("change", importBackup);
    elements.dialog.addEventListener("close", () => {
      activeChapterId = null;
      elements.chapterDetail.innerHTML = "";
    });
  }

  function handleDetailChange(event) {
    const chapter = getActiveChapter();
    if (!chapter) return;

    if (event.target.matches("input[data-checklist-id]")) {
      chapter.checklist[event.target.dataset.checklistId] = event.target.checked;
    } else if (event.target.id === "needs-revision") {
      chapter.needsRevision = event.target.checked;
    } else {
      return;
    }

    saveState(chapter);
    render();
    renderChapterDetail(chapter);
    announce("Change saved automatically.");
  }

  function handleDetailInput(event) {
    const chapter = getActiveChapter();
    if (!chapter) return;

    if (event.target.id === "revision-note") {
      chapter.revisionNote = event.target.value;
    } else if (event.target.id === "general-notes") {
      chapter.notes = event.target.value;
    } else if (event.target.matches("input[data-asset]")) {
      chapter.assets[event.target.dataset.asset] = event.target.value;
    } else {
      return;
    }

    saveState(chapter);
    render();
  }

  function render() {
    renderSummary();
    renderQueues();
    renderChapters();
  }

  function renderSummary() {
    const total = state.chapters.length;
    const complete = state.chapters.filter(isComplete).length;
    const notStarted = state.chapters.filter((chapter) => completedCount(chapter) === 0).length;
    const inProgress = total - complete - notStarted;
    const readyRecord = state.chapters.filter((chapter) => inQueue(chapter, "record")).length;
    const readyCourseArc = state.chapters.filter((chapter) => inQueue(chapter, "coursearc")).length;
    const revisions = state.chapters.filter((chapter) => chapter.needsRevision).length;
    const completedItems = state.chapters.reduce((sum, chapter) => sum + completedCount(chapter), 0);
    const percent = Math.round((completedItems / (total * totalChecklistItems)) * 100);

    const stats = [
      ["Total lectures", total],
      ["Complete", complete],
      ["In progress", inProgress],
      ["Not started", notStarted],
      ["Ready to record", readyRecord],
      ["Ready for CourseArc", readyCourseArc],
      ["Needs revision", revisions]
    ];

    elements.summaryStats.innerHTML = stats.map(([label, value]) => `
      <div class="summary-stat${label === "Needs revision" && value > 0 ? " alert" : ""}">
        <dt>${escapeHtml(label)}</dt>
        <dd>${value}</dd>
      </div>
    `).join("");

    elements.courseProgress.innerHTML = progressMarkup(percent, `Overall course production progress: ${percent}%`);
  }

  function renderQueues() {
    elements.queueControls.innerHTML = config.queues.map((queue) => {
      const count = queue.id === "all"
        ? state.chapters.length
        : state.chapters.filter((chapter) => inQueue(chapter, queue.id)).length;
      const selected = activeQueue === queue.id;
      return `<button type="button" class="queue-button${selected ? " selected" : ""}" data-queue="${queue.id}" aria-pressed="${selected}">${escapeHtml(queue.label)} <span>${count}</span></button>`;
    }).join("");
  }

  function renderChapters() {
    const visible = state.chapters.filter((chapter) => {
      if (elements.hideCompleted.checked && isComplete(chapter) && activeQueue !== "complete") return false;
      if (activeQueue !== "all" && !inQueue(chapter, activeQueue)) return false;
      if (activeWorkType !== "all" && !availableActions(chapter).some((action) => action.workType === activeWorkType)) return false;
      return true;
    });

    const queueLabel = config.queues.find((queue) => queue.id === activeQueue)?.label || "All lectures";
    elements.filterDescription.textContent = activeWorkType === "all"
      ? `Showing ${queueLabel.toLowerCase()}.`
      : `Showing ${queueLabel.toLowerCase()} with available ${activeWorkType.toLowerCase()} work.`;
    elements.resultCount.textContent = `${visible.length} of ${state.chapters.length} lectures shown`;
    elements.emptyState.hidden = visible.length !== 0;

    elements.chapterList.innerHTML = visible.map((chapter) => {
      const percent = progressPercent(chapter);
      const stage = currentStage(chapter);
      const actions = filteredActions(chapter);
      const actionText = actions.length
        ? actions.map((action) => `<li><span>${escapeHtml(action.label)}</span><small>${escapeHtml(action.workType)}</small></li>`).join("")
        : `<li><span>${isComplete(chapter) ? "No further production work" : "No actions match the selected work type"}</span></li>`;

      return `
        <article class="chapter-row${isComplete(chapter) ? " completed" : ""}${chapter.needsRevision ? " revision" : ""}">
          <button type="button" class="chapter-open" data-chapter-id="${chapter.id}" aria-label="Open Chapter ${chapter.number}: ${escapeHtml(chapter.title)}">
            <div class="chapter-identification">
              <p class="chapter-number">Chapter ${chapter.number}</p>
              <h3>${escapeHtml(chapter.title)}</h3>
              <p>${escapeHtml(chapter.module)}</p>
              ${chapter.needsRevision ? '<p class="revision-warning">Needs revision</p>' : ""}
            </div>
            <div class="chapter-status">
              <p><span>Current stage</span><strong>${escapeHtml(stage)}</strong></p>
              ${progressMarkup(percent, `Chapter ${chapter.number} progress: ${percent}%`)}
              <p class="checklist-count">${completedCount(chapter)} of ${totalChecklistItems} checklist items complete</p>
            </div>
            <div class="next-actions">
              <p class="next-actions-heading">Available next actions</p>
              <ul>${actionText}</ul>
            </div>
          </button>
        </article>
      `;
    }).join("");
  }

  function openChapter(id) {
    const chapter = state.chapters.find((item) => item.id === id);
    if (!chapter) return;
    activeChapterId = id;
    renderChapterDetail(chapter);
    elements.dialog.showModal();
  }

  function renderChapterDetail(chapter) {
    const groups = config.groups.map((group) => {
      const items = config.checklist.filter((item) => item.group === group.id);
      return `
        <fieldset class="checklist-group">
          <legend>${escapeHtml(group.label)}</legend>
          ${items.map((item) => `
            <label class="checklist-item">
              <input type="checkbox" data-checklist-id="${item.id}" ${chapter.checklist[item.id] ? "checked" : ""}>
              <span>${escapeHtml(item.label)}</span>
            </label>
          `).join("")}
        </fieldset>
      `;
    }).join("");

    const actions = availableActions(chapter);
    const actionList = actions.length
      ? actions.map((action) => `<li>${escapeHtml(action.label)} <small>${escapeHtml(action.workType)}</small></li>`).join("")
      : "<li>No additional production actions are currently available.</li>";

    elements.chapterDetail.innerHTML = `
      <header class="detail-header">
        <p class="eyebrow">${escapeHtml(chapter.module)}</p>
        <h2 id="dialog-title">Chapter ${chapter.number}: ${escapeHtml(chapter.title)}</h2>
        ${chapter.needsRevision ? '<p class="detail-revision-banner">Needs revision</p>' : ""}
        <div class="detail-status-grid">
          <div><span>Current stage</span><strong>${escapeHtml(currentStage(chapter))}</strong></div>
          <div><span>Overall progress</span><strong>${progressPercent(chapter)}%</strong></div>
          <div><span>Checklist</span><strong>${completedCount(chapter)} of ${totalChecklistItems} complete</strong></div>
          <div><span>PDF branch</span><strong>${escapeHtml(pdfStatus(chapter))}</strong></div>
        </div>
        ${progressMarkup(progressPercent(chapter), `Chapter ${chapter.number} progress: ${progressPercent(chapter)}%`)}
        <p class="last-updated">Last updated: ${formatDate(chapter.lastUpdated)}</p>
      </header>

      <section class="detail-section" aria-labelledby="actions-heading">
        <h3 id="actions-heading">Available next actions</h3>
        <ul class="detail-actions">${actionList}</ul>
        <p class="dependency-note">Dependencies guide these recommendations. Checklist controls remain available in any order.</p>
      </section>

      <section class="revision-panel" aria-labelledby="revision-heading">
        <h3 id="revision-heading">Revision status</h3>
        <label class="toggle-control prominent">
          <input id="needs-revision" type="checkbox" ${chapter.needsRevision ? "checked" : ""}>
          <span>Needs Revision</span>
        </label>
        <label for="revision-note">Revision note</label>
        <textarea id="revision-note" rows="3" placeholder="Describe what needs to change.">${escapeHtml(chapter.revisionNote)}</textarea>
      </section>

      <section class="detail-section" aria-labelledby="checklist-heading">
        <h3 id="checklist-heading">Production checklist</h3>
        <div class="checklist-groups">${groups}</div>
      </section>

      <section class="detail-section" aria-labelledby="assets-heading">
        <h3 id="assets-heading">Chapter assets</h3>
        <div class="asset-fields">
          ${assetField("powerpoint", "PowerPoint file location", chapter.assets.powerpoint)}
          ${assetField("pdf", "PDF file location", chapter.assets.pdf)}
          ${assetField("video", "Final video file location", chapter.assets.video)}
          ${assetField("transcript", "Transcript file location", chapter.assets.transcript)}
          ${assetField("vimeo", "Vimeo link", chapter.assets.vimeo, "url")}
          ${assetField("coursearc", "CourseArc link", chapter.assets.coursearc, "url")}
        </div>
        <p class="dependency-note">Local Windows paths are stored as references. A GitHub Pages site cannot reliably open arbitrary desktop files.</p>
      </section>

      <section class="detail-section" aria-labelledby="notes-heading">
        <h3 id="notes-heading">General notes</h3>
        <label class="visually-hidden" for="general-notes">General notes</label>
        <textarea id="general-notes" rows="5" placeholder="Add production notes.">${escapeHtml(chapter.notes)}</textarea>
      </section>
    `;
  }

  function assetField(key, label, value, type = "text") {
    return `
      <label>
        <span>${escapeHtml(label)}</span>
        <input type="${type}" data-asset="${key}" value="${escapeHtml(value)}">
      </label>
    `;
  }

  function availableActions(chapter) {
    if (isComplete(chapter)) return [];
    return config.checklist
      .filter((item) => !chapter.checklist[item.id])
      .filter((item) => item.prerequisites.every((id) => chapter.checklist[id]))
      .map((item) => ({ id: item.id, label: item.action, workType: item.workType }));
  }

  function filteredActions(chapter) {
    const actions = availableActions(chapter);
    return activeWorkType === "all" ? actions : actions.filter((action) => action.workType === activeWorkType);
  }

  function inQueue(chapter, queue) {
    const c = chapter.checklist;
    switch (queue) {
      case "script": return !c.chapter_uploaded || !c.script_generated || !c.script_reviewed || !c.powerpoint_generated;
      case "powerpoint": return c.powerpoint_generated && !c.powerpoint_reviewed;
      case "images": return c.powerpoint_reviewed && (!c.images_sourced || !c.visual_design_complete);
      case "accessibility": return c.visual_design_complete && !c.ppt_accessibility;
      case "record": return c.ppt_accessibility && !c.voice_over;
      case "video": return c.voice_over && !c.video_edited;
      case "uploads": return c.video_edited && (!c.vimeo_uploaded || !c.clipchamp_uploaded);
      case "transcript": return c.clipchamp_uploaded && (!c.transcript_generated || !c.transcript_finalized);
      case "pdf": return c.ppt_accessibility && (!c.pdf_exported || !c.pdf_accessibility);
      case "coursearc": return c.vimeo_uploaded && c.transcript_finalized && c.pdf_accessibility && !c.lecture_complete;
      case "revision": return chapter.needsRevision;
      case "complete": return isComplete(chapter);
      case "all": return true;
      default: return false;
    }
  }

  function currentStage(chapter) {
    const c = chapter.checklist;
    if (c.lecture_complete) return "Complete";
    if (c.coursearc_vimeo || c.coursearc_transcript || c.coursearc_pdf || (c.vimeo_uploaded && c.transcript_finalized && c.pdf_accessibility)) return "CourseArc";
    if (c.transcript_generated || c.transcript_finalized || (c.vimeo_uploaded && c.clipchamp_uploaded)) return "Transcript";
    if (c.voice_over || c.video_edited || c.vimeo_uploaded || c.clipchamp_uploaded) return "Video Production";
    if (c.ppt_accessibility) return "Ready to Record";
    if (c.visual_design_complete) return "Accessibility";
    if (c.images_sourced || c.powerpoint_reviewed) return "Images";
    if (c.powerpoint_generated) return "PowerPoint";
    if (c.chapter_uploaded || c.script_generated || c.script_reviewed) return "Script";
    return "Not Started";
  }

  function pdfStatus(chapter) {
    if (chapter.checklist.pdf_accessibility) return "Accessible PDF complete";
    if (chapter.checklist.pdf_exported) return "Accessibility check needed";
    if (chapter.checklist.ppt_accessibility) return "Ready to export";
    return "Waiting for accessible PowerPoint";
  }

  function completedCount(chapter) {
    return checklistIds.filter((id) => chapter.checklist[id]).length;
  }

  function progressPercent(chapter) {
    return Math.round((completedCount(chapter) / totalChecklistItems) * 100);
  }

  function isComplete(chapter) {
    return chapter.checklist.lecture_complete === true;
  }

  function progressMarkup(percent, label) {
    return `
      <div class="progress-block" aria-label="${escapeHtml(label)}">
        <div class="progress-track" aria-hidden="true"><span style="width: ${percent}%"></span></div>
        <strong>${percent}%</strong>
      </div>
    `;
  }

  function getActiveChapter() {
    return state.chapters.find((chapter) => chapter.id === activeChapterId);
  }

  function exportBackup() {
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lecture-production-tracker-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    announce("Backup exported.");
  }

  async function importBackup(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch (error) {
      announce("Import failed. The selected file is not valid JSON.");
      return;
    }

    const validation = validateBackup(parsed);
    if (!validation.valid) {
      announce(`Import failed. ${validation.message}`);
      return;
    }

    const confirmed = window.confirm("This valid backup will replace all current tracker data in this browser. Continue?");
    if (!confirmed) {
      announce("Import canceled. Current data was not changed.");
      return;
    }

    state = parsed;
    localStorage.setItem(config.storageKey, JSON.stringify(state));
    render();
    announce("Backup imported. Current tracker data was replaced.");
  }

  function validateBackup(data) {
    if (!data || typeof data !== "object") return { valid: false, message: "The backup must contain a data object." };
    if (data.version !== config.version) return { valid: false, message: "The backup version is not supported." };
    if (!Array.isArray(data.chapters) || data.chapters.length !== config.chapters.length) return { valid: false, message: "The chapter list is incomplete or unexpected." };

    const expectedIds = new Set(config.chapters.map((chapter) => `chapter-${String(chapter.number).padStart(2, "0")}`));
    for (const chapter of data.chapters) {
      if (!chapter || !expectedIds.has(chapter.id)) return { valid: false, message: "A chapter identifier is invalid." };
      if (!chapter.checklist || checklistIds.some((id) => typeof chapter.checklist[id] !== "boolean")) return { valid: false, message: "A chapter checklist is invalid." };
      if (typeof chapter.needsRevision !== "boolean" || typeof chapter.revisionNote !== "string" || typeof chapter.notes !== "string") return { valid: false, message: "A chapter note or revision field is invalid." };
      if (!chapter.assets || ["powerpoint", "pdf", "video", "transcript", "vimeo", "coursearc"].some((key) => typeof chapter.assets[key] !== "string")) return { valid: false, message: "A chapter asset field is invalid." };
      expectedIds.delete(chapter.id);
    }
    if (expectedIds.size) return { valid: false, message: "One or more required chapters are missing." };
    return { valid: true, message: "" };
  }

  function announce(message) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.classList.add("visible");
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => elements.statusMessage.classList.remove("visible"), 3500);
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
