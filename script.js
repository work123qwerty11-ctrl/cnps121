(() => {
  "use strict";

  const TELEGRAM_ENDPOINT =
    "https://calm-band-0308.work123qwerty11.workers.dev/submit";

  const SITE_NAME = "CNPC CFA Partner";

  const form = document.querySelector("#applicationForm");
  const message = document.querySelector("#formMessage");

  if (!form) {
    console.error("Форма #applicationForm не найдена.");
    return;
  }

  // FAQ
  document.querySelectorAll(".faq-list details").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;

      document.querySelectorAll(".faq-list details").forEach((other) => {
        if (other !== item) {
          other.open = false;
        }
      });
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const button = form.querySelector(".form-submit");

    if (!button) {
      console.error("Кнопка отправки не найдена.");
      return;
    }

    const formData = new FormData(form);

    // Защита от ботов
    const website = String(formData.get("website") || "").trim();

    if (website) {
      console.warn("Spam detected.");
      return;
    }

    const name = String(formData.get("name") || "").trim();
    const contact = String(formData.get("contact") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const experience = String(formData.get("experience") || "").trim();
    const income = String(formData.get("income") || "").trim();

    // НОВОЕ
    const date = String(formData.get("date") || "").trim();
    const time = String(formData.get("time") || "").trim();

    const consent = formData.get("consent") === "yes";

    if (
      !name ||
      !contact ||
      !email ||
      !experience ||
      !income ||
      !date ||
      !time ||
      !consent
    ) {
      form.reportValidity();
      return;
    }

    const originalButtonText = button.innerHTML;

    button.disabled = true;
    button.textContent = "Отправляем…";

    if (message) {
      message.textContent = "Отправляем заявку…";
      message.classList.remove("success");
    }

    try {
      const response = await fetch(TELEGRAM_ENDPOINT, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },

        body: JSON.stringify({
          name: name,
          contact: contact,
          phone: contact,
          email: email,
          experience: experience,
          income: income,

          // ДАТА И ВРЕМЯ
          date: date,
          time: time,

          consent: consent,
          website: "",
          source: SITE_NAME,
          site: SITE_NAME,
          page: window.location.href,
          submittedAt: new Date().toISOString()
        })
      });

      const responseText = await response.text();

      let result = {};

      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch (error) {
          // Worker может вернуть обычный текст
        }
      }

      if (
        !response.ok ||
        result.ok === false ||
        result.success === false ||
        result.error
      ) {
        throw new Error(
          result.error ||
          responseText ||
          `Ошибка отправки (${response.status})`
        );
      }

      form.reset();

      if (message) {
        message.textContent =
          "Спасибо! Заявка отправлена. Мы свяжемся с вами.";
        message.classList.add("success");
      }

    } catch (error) {
      console.error("Ошибка отправки формы:", error);

      if (message) {
        message.textContent =
          "Не удалось отправить заявку. Проверьте подключение и попробуйте ещё раз.";
        message.classList.remove("success");
      }

    } finally {
      button.disabled = false;
      button.innerHTML = originalButtonText;
    }
  });
})();
