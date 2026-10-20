// AfriBridge premium website interactions
(() => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".primary-nav");

  if (toggle && nav) {
    const closeMenu = () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
      nav.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    };

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
      nav.classList.toggle("is-open", !isOpen);
      document.body.classList.toggle("menu-open", !isOpen);
    });

    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) closeMenu();
    });
  }

  // Reveal content as it enters the viewport; show everything if unsupported.
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("is-visible"));
  }

  // FAQ: keep the page calm by allowing one answer open at a time.
  document.querySelectorAll(".faq-list details").forEach(detail => {
    detail.addEventListener("toggle", () => {
      if (detail.open) {
        document.querySelectorAll(".faq-list details").forEach(other => {
          if (other !== detail) other.open = false;
        });
      }
    });
  });


  // Project starter: turn the visitor's choices into a draft enquiry (no auto-send).
  const starterForm = document.getElementById("starter-form");
  if (starterForm) {
    starterForm.addEventListener("submit", event => {
      event.preventDefault();
      const sector = document.getElementById("starter-sector").value;
      const country = document.getElementById("starter-country").value.trim();
      const budget = document.getElementById("starter-budget").value;
      const timeline = document.getElementById("starter-timeline").value;
      const brief = `Project brief from website planner\nSector: ${sector}\nDestination / country: ${country}\nEstimated budget: ${budget}\nTimeline: ${timeline}\n\nAdditional details: `;
      const interest = document.getElementById("interest");
      if (interest) {
        const mapping = {
          "Technology & ICT": "Technology / ICT project",
          "Pharmaceuticals": "Pharmaceutical sourcing",
          "Industrial equipment": "Industrial equipment",
          "Mining & infrastructure": "Mining / infrastructure",
          "Precious metals": "Precious metals enquiry",
          "Agriculture & other supplies": "Other",
          "Business partnership": "Business partnership"
        };
        interest.value = mapping[sector] || "Other";
      }
      const message = document.getElementById("message");
      if (message) message.value = brief;
      const status = document.getElementById("starter-status");
      if (status) status.textContent = "Your draft is ready below. Review it, add your contact details and any extra specifications, then submit the enquiry yourself.";
      const contact = document.getElementById("contact");
      if (contact) contact.scrollIntoView({ behavior: "smooth", block: "start" });
      if (message) window.setTimeout(() => message.focus({ preventScroll: true }), 500);
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Same-origin API submission. The server validates and stores enquiries in PostgreSQL.
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (form && status) {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (!form.reportValidity()) {
        status.textContent = "Please complete the required fields.";
        status.className = "form-status is-error";
        return;
      }
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      status.textContent = "Sending your enquiry securely…";
      status.className = "form-status";
      try {
        const data = Object.fromEntries(new FormData(form).entries());
        data.consent = form.querySelector('[name="consent"]')?.checked === true;
        const response = await fetch("/api/enquiries", {
          method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(data), credentials: "same-origin"
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "We could not submit your enquiry. Please try again or contact us on WhatsApp.");
        status.textContent = "Thank you. Your enquiry has been received securely. AfriBridge will review it and contact you.";
        status.className = "form-status is-success";
        form.reset();
      } catch (error) {
        status.textContent = error.message || "Connection error. Please try again or contact us on WhatsApp.";
        status.className = "form-status is-error";
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }
})();
