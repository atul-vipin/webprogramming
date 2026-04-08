(function () {
  "use strict";

  const STORAGE_KEYS = {
    usersCsv: "elcUsersCsv",
    session: "elcSession",
    feedback: "elcFeedback",
    feedbackList: "elcFeedbackList",
    contactList: "elcContactList"
  };

  const CSV_HEADER = ["fullName", "email", "password", "course", "location", "registeredAt"];

  document.addEventListener("DOMContentLoaded", function () {
    initializeCsvStore();
    highlightActiveNav();
    setupNavVisibility();
    setupProtectedRoute();
    setupFeedbackForm();
    setupContactForm();
    setupLoggedInVisibility();
    setupHomePage();
  });

  function initializeCsvStore() {
    if (!localStorage.getItem(STORAGE_KEYS.usersCsv)) {
      localStorage.setItem(STORAGE_KEYS.usersCsv, CSV_HEADER.join(",") + "\n");
    }
  }

  function getCurrentPage() {
    const path = window.location.pathname;
    return path || "/";
  }

  function getSessionUser() {
    return readJson(STORAGE_KEYS.session);
  }

  function setSessionUser(user) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
  }

  function clearSessionUser() {
    localStorage.removeItem(STORAGE_KEYS.session);
  }

  function highlightActiveNav() {
    const path = getCurrentPage();
    const links = document.querySelectorAll(".navbar a");

    links.forEach(function (link) {
      const href = link.getAttribute("href");
      if (href === path) {
        link.classList.add("active-link");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function setupNavVisibility() {
    const sessionUser = getSessionUser();
    const protectedHrefs = ["/learn", "/assessment"];
    const authHref = "/register";

    document.querySelectorAll(".navbar a").forEach(function (link) {
      const href = link.getAttribute("href");

      if (!sessionUser && protectedHrefs.indexOf(href) !== -1) {
        link.classList.add("hidden");
      } else {
        link.classList.remove("hidden");
      }

      if (sessionUser && href === authHref) {
        link.classList.add("hidden");
      }
    });


    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    let authPanel = document.getElementById("authPanel");
    if (!authPanel) {
      authPanel = document.createElement("span");
      authPanel.id = "authPanel";
      authPanel.className = "auth-panel";
      navbar.appendChild(authPanel);
    }

    if (!sessionUser) {
      authPanel.innerHTML = "";
      return;
    }

    authPanel.innerHTML = "<span>Logged in: " + escapeHtml(sessionUser.email) + "</span>";
    const logoutBtn = document.createElement("button");
    logoutBtn.type = "button";
    logoutBtn.className = "button tiny-btn";
    logoutBtn.textContent = "Logout";
    logoutBtn.addEventListener("click", function () {
      clearSessionUser();
      window.location.href = "/register";
    });
    authPanel.appendChild(logoutBtn);
  }

  function setupProtectedRoute() {
    const path = getCurrentPage();
    const needsAuth = ["/learn", "/assessment"];
    if (needsAuth.indexOf(path) === -1) return;

    const sessionUser = getSessionUser();
    if (sessionUser) return;

    window.location.href = "/register?next=" + encodeURIComponent(path);
  }

  function setupHomePage() {
    const hint = document.getElementById("homeAuthHint");
    if (!hint) return;

    if (getSessionUser()) {
      showMessage(hint, "You can open Learn and Assessment from the menu.", false);
    } else {
      showMessage(hint, "Learn and Assessment become available after login.", true);
    }
  }

  function setupLoggedInVisibility() {
    const sessionUser = getSessionUser();
    const hideWhenLoggedIn = document.querySelectorAll(".hide-when-logged-in");
    hideWhenLoggedIn.forEach(function (el) {
      el.classList.toggle("hidden", Boolean(sessionUser));
    });
  }

  function setupFeedbackForm() {
    const form = document.getElementById("feedbackForm");
    if (!form) return;

    const message = document.getElementById("feedbackMessage");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        showMessage(message, "Please complete all feedback fields.", true);
        return;
      }

      const payload = {
        name: document.getElementById("feedbackName").value.trim(),
        email: document.getElementById("feedbackEmail").value.trim().toLowerCase(),
        learned: document.getElementById("learned").value.trim(),
        suggestions: document.getElementById("suggestions").value.trim(),
        rating: document.getElementById("rating").value,
        submittedAt: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEYS.feedback, JSON.stringify(payload));
      const list = readJson(STORAGE_KEYS.feedbackList) || [];
      list.push(payload);
      localStorage.setItem(STORAGE_KEYS.feedbackList, JSON.stringify(list));
      showMessage(message, "Thanks. Your feedback was saved successfully.", false);
      form.reset();
    });
  }

  function setupContactForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    let status = document.getElementById("contactMessageStatus");
    if (!status) {
      status = document.createElement("p");
      status.id = "contactMessageStatus";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      form.appendChild(status);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        showMessage(status, "Please fill all contact fields.", true);
        return;
      }

      const payload = {
        name: document.getElementById("contactName").value.trim(),
        email: document.getElementById("contactEmail").value.trim().toLowerCase(),
        subject: document.getElementById("contactSubject").value.trim(),
        message: document.getElementById("contactMessage").value.trim(),
        submittedAt: new Date().toISOString()
      };

      const list = readJson(STORAGE_KEYS.contactList) || [];
      list.push(payload);
      localStorage.setItem(STORAGE_KEYS.contactList, JSON.stringify(list));
      showMessage(status, "Thanks! We received your message.", false);
      form.reset();
    });
  }

  function upsertUserIntoCsv(user) {
    const users = parseUsersCsv(localStorage.getItem(STORAGE_KEYS.usersCsv));
    const existingIndex = users.findIndex(function (entry) {
      return entry.email === user.email;
    });

    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }

    localStorage.setItem(STORAGE_KEYS.usersCsv, usersToCsv(users));
  }

  function authenticateUser(email, password) {
    const users = parseUsersCsv(localStorage.getItem(STORAGE_KEYS.usersCsv));
    return users.find(function (entry) {
      return entry.email === email && entry.password === password;
    }) || null;
  }

  function parseUsersCsv(csvText) {
    if (!csvText) return [];

    const lines = csvText.split(/\r?\n/).filter(function (line) {
      return line.trim().length > 0;
    });

    if (lines.length <= 1) return [];

    const users = [];
    for (let i = 1; i < lines.length; i += 1) {
      const fields = splitCsvLine(lines[i]);
      users.push({
        fullName: fields[0] || "",
        email: (fields[1] || "").toLowerCase(),
        password: fields[2] || "",
        course: fields[3] || "",
        location: fields[4] || "",
        registeredAt: fields[5] || ""
      });
    }

    return users;
  }

  function usersToCsv(users) {
    const rows = [CSV_HEADER.join(",")];

    users.forEach(function (user) {
      rows.push([
        csvEscape(user.fullName),
        csvEscape(user.email),
        csvEscape(user.password),
        csvEscape(user.course),
        csvEscape(user.location),
        csvEscape(user.registeredAt)
      ].join(","));
    });

    return rows.join("\n") + "\n";
  }

  function splitCsvLine(line) {
    const out = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];

      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(current);
        current = "";
      } else {
        current += ch;
      }
    }

    out.push(current);
    return out;
  }

  function csvEscape(value) {
    const text = String(value || "");
    if (text.indexOf('"') !== -1 || text.indexOf(",") !== -1 || text.indexOf("\n") !== -1) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function formatCourse(course) {
    if (course === "mobile") return "Inner workings of mobile";
    if (course === "tv") return "Inner workings of television";
    return "Inner workings of mobile and television";
  }

  function showMessage(node, text, isError) {
    if (!node) return;
    node.textContent = text;
    node.classList.toggle("status-error", Boolean(isError));
    node.classList.toggle("status-success", !isError);
  }

  function readJson(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
