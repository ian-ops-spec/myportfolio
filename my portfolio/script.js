// Add or edit unit descriptions here. Record only activities you actually performed.
const trainingUnits = [
    { id: "web-design", number: "01", title: "Web Design", description: "Principles and practice of planning, designing, building and evaluating user-facing websites.", introduction: "Record your Web Design attachment learning, selected task procedures, tools and original photographic evidence.", objectives: [], activities: [], steps: [], tools: [], skills: [], challenges: [] },
    { id: "computer-organization-and-architecture", number: "02", title: "Computer Organization and Architecture", description: "How computer systems are structured, including processors, memory, input/output and their interactions.", introduction: "Record your Computer Organization and Architecture attachment learning, task procedures, tools and original evidence.", objectives: [], activities: [], steps: [], tools: [], skills: [], challenges: [] },
    { id: "graphic-design", number: "03", title: "Graphic Design", description: "Visual communication through layout, typography, colour, imagery and digital design.", introduction: "Record your Graphic Design attachment learning, selected task procedures, tools and original photographic evidence.", objectives: [], activities: [], steps: [], tools: [], skills: [], challenges: [] },
    { id: "operating-systems", number: "04", title: "Operating Systems", description: "Operating system concepts including processes, memory, files, devices and system resources.", introduction: "Record your Operating Systems attachment learning, selected task procedures, tools and original evidence.", objectives: [], activities: [], steps: [], tools: [], skills: [], challenges: [] },
    { id: "artificial-intelligence", number: "05", title: "Artificial Intelligence", description: "Foundational ideas in intelligent systems, data-driven methods, search and automated reasoning.", introduction: "Record your Artificial Intelligence attachment learning, selected task procedures, tools and original evidence.", objectives: [], activities: [], steps: [], tools: [], skills: [], challenges: [] },
    { id: "java-programming", number: "06", title: "Java Programming", description: "The Java language, object-oriented programming and software development practices.", introduction: "Record your Java Programming attachment learning, selected task procedures, tools and original photographic evidence.", objectives: [], activities: [], steps: [], tools: [], skills: [], challenges: [] },
    { id: "database-management-systems", number: "07", title: "Database Management Systems (DBMS)", description: "Database design, data models, query systems and the management of stored information.", introduction: "Record your DBMS attachment learning, selected task procedures, tools and original photographic evidence.", objectives: [], activities: [], steps: [], tools: [], skills: [], challenges: [] },
    { id: "networking-and-distributed-systems", number: "08", title: "Networking and Distributed Systems", description: "Computer communication, network protocols and systems coordinating connected computers.", introduction: "Record your Networking and Distributed Systems attachment learning, tools and original photographic evidence.", objectives: [], activities: [], steps: [], tools: [], skills: [], challenges: [] },
    { id: "algorithms-and-data-structures", number: "09", title: "Algorithms and Data Structures", description: "Methods for designing and analyzing algorithms and organizing information for processing.", introduction: "Record your Algorithms and Data Structures attachment learning, selected tasks and original evidence.", objectives: [], activities: [], steps: [], tools: [], skills: [], challenges: [] },
    { id: "mathematics-for-computer-science", number: "10", title: "Mathematics for Computer Science", description: "Mathematical methods and reasoning that support the analysis and development of computer science systems.", introduction: "Record your Mathematics for Computer Science learning, relevant practical applications and original evidence.", objectives: [], activities: [], steps: [], tools: [], skills: [], challenges: [] },
    { id: "information-systems", number: "11", title: "Information Systems", description: "The organization, processes and technologies used to collect, manage and use information.", introduction: "Record your Information Systems attachment learning, relevant tasks, tools and original evidence.", objectives: [], activities: [], steps: [], tools: [], skills: [], challenges: [] }
];

const databaseName = "ian-witinga-attachment-evidence";
const evidenceStoreName = "photographs";
const emptyFieldMessage = "Add your verified attachment details here.";

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    return element;
}

function openEvidenceDatabase() {
    return new Promise((resolve, reject) => {
        if (!("indexedDB" in window)) {
            reject(new Error("This browser does not support local photo storage."));
            return;
        }

        const request = indexedDB.open(databaseName, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(evidenceStoreName, { keyPath: "id" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Could not open photo storage."));
        request.onblocked = () => reject(new Error("Photo storage is blocked by another open portfolio tab. Close older tabs and reload."));
    });
}

function runEvidenceTransaction(mode, operation) {
    return openEvidenceDatabase().then(database => new Promise((resolve, reject) => {
        const transaction = database.transaction(evidenceStoreName, mode);
        const store = transaction.objectStore(evidenceStoreName);
        let result;
        transaction.oncomplete = () => {
            database.close();
            resolve(result);
        };
        transaction.onerror = () => {
            database.close();
            reject(transaction.error || new Error("Could not save your photo evidence."));
        };
        transaction.onabort = () => {
            database.close();
            reject(transaction.error || new Error("Photo evidence could not be saved."));
        };
        try {
            result = operation(store);
        } catch (error) {
            database.close();
            reject(error);
        }
    }));
}

function getAllEvidence() {
    return runEvidenceTransaction("readonly", store => {
        const request = store.getAll();
        request.onsuccess = () => {
            request.result.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        };
        return request;
    }).then(request => request.result);
}

function saveEvidenceBatch(records) {
    return runEvidenceTransaction("readwrite", store => {
        records.forEach(record => store.add(record));
    });
}

function deleteEvidence(id) {
    return runEvidenceTransaction("readwrite", store => store.delete(id));
}

function displayStorageError(message) {
    document.querySelectorAll("[data-storage-status]").forEach(status => {
        status.textContent = message;
        status.hidden = false;
        status.classList.add("status-error");
    });
}

function imageObjectUrl(record) {
    return URL.createObjectURL(record.image);
}

function clearEvidenceGallery(gallery) {
    gallery.querySelectorAll(".evidence-card:not([data-static-evidence]), .empty-gallery").forEach(card => {
        const image = card.querySelector("img");
        if (image && image.src.startsWith("blob:")) URL.revokeObjectURL(image.src);
        card.remove();
    });
}

function addEvidenceCard(container, record, unit, deletable) {
    const card = document.createElement("article");
    card.className = "evidence-card";
    const imageButton = document.createElement("button");
    imageButton.className = "evidence-image-button";
    imageButton.type = "button";
    imageButton.setAttribute("aria-label", `Enlarge photograph: ${record.caption}`);
    const image = document.createElement("img");
    image.src = imageObjectUrl(record);
    image.alt = record.caption;
    image.loading = "lazy";
    image.decoding = "async";
    imageButton.append(image);
    imageButton.addEventListener("click", () => openLightbox(image.src, record, unit.title));
    card.append(imageButton);

    const copy = document.createElement("div");
    copy.className = "evidence-copy";
    copy.append(createTextElement("h4", "", record.caption));
    copy.append(createTextElement("p", "", record.description));
    const unitLink = createTextElement("a", "evidence-unit", unit.title);
    unitLink.href = `units/${unit.id}.html`;
    copy.append(unitLink);
    if (record.date) copy.append(createTextElement("time", "evidence-date", record.date));

    if (deletable) {
        const removeButton = createTextElement("button", "evidence-delete", "Remove photo");
        removeButton.type = "button";
        removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;
            try {
                await deleteEvidence(record.id);
                const image = card.querySelector("img");
                if (image && image.src.startsWith("blob:")) URL.revokeObjectURL(image.src);
                card.remove();
                if (!container.querySelector(".evidence-card")) {
                    container.append(createTextElement("p", "empty-gallery", "No photographs have been added to this unit yet."));
                }
            } catch (error) {
                removeButton.disabled = false;
                displayStorageError(error.message);
            }
        });
        copy.append(removeButton);
    }

    card.append(copy);
    container.append(card);
}

function openLightbox(src, record, unitTitle) {
    const lightbox = document.getElementById("photoLightbox");
    if (!lightbox) return;
    const image = lightbox.querySelector(".lightbox-image");
    image.src = src;
    image.alt = record.caption;
    const caption = lightbox.querySelector(".lightbox-caption");
    caption.replaceChildren(
        createTextElement("strong", "", record.caption),
        createTextElement("span", "", record.description),
        createTextElement("span", "lightbox-unit", unitTitle)
    );
    if (record.date) caption.append(createTextElement("time", "", record.date));
    lightbox.showModal();
}

function setupLightbox() {
    const lightbox = document.getElementById("photoLightbox");
    if (!lightbox) return;
    lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
    lightbox.addEventListener("click", event => {
        if (event.target === lightbox) lightbox.close();
    });
    const unitTitle = document.getElementById("unitTitle")?.textContent || "";
    document.querySelectorAll("[data-static-evidence] .evidence-image-button").forEach(button => {
        button.addEventListener("click", () => {
            const card = button.closest(".evidence-card");
            const image = button.querySelector("img");
            if (!card || !image) return;
            openLightbox(image.src, {
                caption: card.querySelector("h4")?.textContent || image.alt,
                description: card.querySelector(".evidence-copy p")?.textContent || "",
                date: card.querySelector("time")?.dateTime || ""
            }, unitTitle);
        });
    });
}

function renderTrainingUnitCards() {
    const grid = document.getElementById("trainingUnitGrid");
    if (!grid) return;

    trainingUnits.forEach(unit => {
        const card = document.createElement("article");
        card.className = "training-unit-card";
        card.append(createTextElement("span", "training-unit-number", unit.number));
        card.append(createTextElement("h3", "", unit.title));
        card.append(createTextElement("p", "", unit.description));
        const link = createTextElement("a", "unit-view-link", "View Unit");
        link.href = `units/${unit.id}.html`;
        link.append(createTextElement("span", "", "→"));
        card.append(link);
        grid.append(card);
    });
}

function renderPhotoUpload(unit) {
    const form = document.getElementById("photoUploadForm");
    if (!form) return;

    const fileInput = form.querySelector('input[type="file"]');
    const pendingContainer = document.getElementById("pendingPhotos");
    const saveButton = form.querySelector('[type="submit"]');
    let pendingPhotos = [];

    fileInput.addEventListener("change", () => {
        const files = Array.from(fileInput.files || []);
        const invalidFiles = files.filter(file => !file.type.startsWith("image/"));
        pendingPhotos = files.filter(file => file.type.startsWith("image/"));
        pendingContainer.replaceChildren();

        if (invalidFiles.length > 0) {
            displayStorageError("Only image files can be added as photo evidence.");
        }

        if (pendingPhotos.length === 0) return;
        pendingPhotos.forEach((file, index) => {
            const editor = document.createElement("fieldset");
            editor.className = "pending-photo";
            editor.dataset.photoIndex = String(index);
            editor.append(createTextElement("legend", "", file.name));

            const captionLabel = createTextElement("label", "", "Caption");
            const captionInput = document.createElement("input");
            captionInput.name = "caption";
            captionInput.type = "text";
            captionInput.required = true;
            captionInput.maxLength = 120;
            captionInput.value = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
            captionLabel.append(captionInput);

            const descriptionLabel = createTextElement("label", "", "Activity explanation");
            const descriptionInput = document.createElement("textarea");
            descriptionInput.name = "description";
            descriptionInput.required = true;
            descriptionInput.maxLength = 600;
            descriptionInput.rows = 3;
            descriptionLabel.append(descriptionInput);

            const dateLabel = createTextElement("label", "", "Date (optional)");
            const dateInput = document.createElement("input");
            dateInput.name = "date";
            dateInput.type = "date";
            dateLabel.append(dateInput);

            editor.append(captionLabel, descriptionLabel, dateLabel);
            pendingContainer.append(editor);
        });
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (pendingPhotos.length === 0) {
            displayStorageError("Choose one or more photographs before saving.");
            return;
        }

        const editors = Array.from(pendingContainer.querySelectorAll(".pending-photo"));
        if (!editors.every(editor => editor.reportValidity())) return;

        saveButton.disabled = true;
        const status = document.querySelector("[data-storage-status]");
        status.hidden = true;
        try {
            const records = pendingPhotos.map((file, index) => {
                const editor = editors[index];
                return {
                    id: `${unit.id}-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
                    unitId: unit.id,
                    image: file,
                    caption: editor.querySelector('[name="caption"]').value.trim(),
                    description: editor.querySelector('[name="description"]').value.trim(),
                    date: editor.querySelector('[name="date"]').value
                };
            });
            await saveEvidenceBatch(records);
            pendingPhotos = [];
            fileInput.value = "";
            pendingContainer.replaceChildren();
            await renderUnitEvidence(unit);
            status.textContent = "Your photographs were saved in this browser.";
            status.hidden = false;
            status.classList.remove("status-error");
        } catch (error) {
            displayStorageError(`Could not save the selected photographs. ${error.message}`);
        } finally {
            saveButton.disabled = false;
        }
    });
}

async function renderUnitEvidence(unit) {
    const gallery = document.getElementById("unitEvidenceGallery");
    if (!gallery) return;
    const staticEvidence = document.getElementById("staticUnitEvidence");
    if (staticEvidence) {
        gallery.append(staticEvidence.content.cloneNode(true));
        staticEvidence.remove();
    }
    clearEvidenceGallery(gallery);
    try {
        const records = (await getAllEvidence()).filter(record => record.unitId === unit.id);
        if (records.length === 0 && !gallery.querySelector(".evidence-card")) {
            gallery.append(createTextElement("p", "empty-gallery", "No photographs have been added to this unit yet."));
            return;
        }
        records.forEach(record => addEvidenceCard(gallery, record, unit, true));
    } catch (error) {
        displayStorageError(`Photo storage is unavailable. ${error.message}`);
        if (!gallery.querySelector(".evidence-card")) {
            gallery.append(createTextElement("p", "empty-gallery", "Photographs could not be loaded."));
        }
    }
}

async function renderPortfolioEvidence() {
    const gallery = document.getElementById("evidenceGallery");
    if (!gallery) return;
    try {
        const records = await getAllEvidence();
        const unitById = new Map(trainingUnits.map(unit => [unit.id, unit]));
        const validRecords = records.filter(record => unitById.has(record.unitId));
        if (validRecords.length === 0) {
            gallery.append(createTextElement("p", "empty-gallery", "No photographs have been added yet. Open a training unit page to add your real attachment photographs."));
            return;
        }
        validRecords.forEach(record => addEvidenceCard(gallery, record, unitById.get(record.unitId), false));
    } catch (error) {
        displayStorageError(`Photo storage is unavailable. ${error.message}`);
        gallery.append(createTextElement("p", "empty-gallery", "Photographs could not be loaded."));
    }
}

function renderUnitPage() {
    const page = document.querySelector("[data-unit-page]");
    if (!page) return;

    const unit = trainingUnits.find(item => item.id === page.dataset.unitPage);
    if (!unit) {
        document.getElementById("unitPageContent").replaceChildren(
            createTextElement("h1", "", "Unit not found"),
            createTextElement("p", "", "Return to the portfolio and choose a training unit.")
        );
        return;
    }

    document.title = `${unit.title} | Ian Witinga`;
    document.getElementById("unitNumber").textContent = `UNIT ${unit.number}`;
    document.getElementById("unitTitle").textContent = unit.title;
    document.getElementById("unitIntroduction").textContent = unit.introduction;
    document.getElementById("unitDescription").textContent = unit.description;

    const fieldDefinitions = [
        ["Practical objectives", "objectives"],
        ["Practical activities performed", "activities"],
        ["Selected task: step-by-step procedure", "steps"],
        ["Tools, software & equipment used", "tools"],
        ["Skills acquired", "skills"],
        ["Challenges encountered & solutions", "challenges"]
    ];
    const fields = document.getElementById("unitReportFields");
    const editNote = createTextElement(
        "p",
        "unit-edit-note",
        `To edit this unit's report, update its objectives, activities, steps, tools, skills and challenges arrays in script.js. Photographs are saved in this browser.`
    );
    fields.before(editNote);
    fieldDefinitions.forEach(([label, key]) => {
        const field = document.createElement("section");
        field.className = "unit-field";
        field.append(createTextElement("h3", "", label));
        const entries = unit[key] || [];
        if (entries.length === 0) {
            field.append(createTextElement("p", "empty-field", emptyFieldMessage));
        } else {
            const list = document.createElement(key === "steps" ? "ol" : "ul");
            entries.forEach(entry => list.append(createTextElement("li", "", entry)));
            field.append(list);
        }
        fields.append(field);
    });

    const index = trainingUnits.indexOf(unit);
    const navigation = document.getElementById("unitNavigation");
    const previous = trainingUnits[index - 1];
    const next = trainingUnits[index + 1];
    if (previous) {
        const link = createTextElement("a", "unit-nav-link unit-nav-previous", `← ${previous.title}`);
        link.href = `${previous.id}.html`;
        navigation.append(link);
    } else {
        navigation.append(createTextElement("span", "unit-nav-placeholder", "First training unit"));
    }
    const allUnitsLink = createTextElement("a", "unit-nav-all", "All training units");
    allUnitsLink.href = "../index.html#training-units";
    navigation.append(allUnitsLink);
    if (next) {
        const link = createTextElement("a", "unit-nav-link unit-nav-next", `${next.title} →`);
        link.href = `${next.id}.html`;
        navigation.append(link);
    } else {
        navigation.append(createTextElement("span", "unit-nav-placeholder", "Last training unit"));
    }

    renderPhotoUpload(unit);
    renderUnitEvidence(unit);
}

document.getElementById("year").textContent = new Date().getFullYear();
renderTrainingUnitCards();
renderPortfolioEvidence();
renderUnitPage();
setupLightbox();

const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");
if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => {
        const isOpen = menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", String(!isOpen));
        menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
        navLinks.classList.toggle("active", !isOpen);
    });

    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.setAttribute("aria-label", "Open navigation");
        });
    });
}

const profileImage = document.querySelector(".profile-image");
if (profileImage) {
    const showProfilePlaceholder = () => {
        profileImage.hidden = true;
        document.querySelector(".profile-placeholder").hidden = false;
    };
    if (profileImage.complete && profileImage.naturalWidth === 0) {
        showProfilePlaceholder();
    } else {
        profileImage.addEventListener("error", showProfilePlaceholder, { once: true });
    }
}
