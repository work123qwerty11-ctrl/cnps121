(() => {
  "use strict";

  // Сайт -> Cloudflare Worker -> Telegram
  const TELEGRAM_ENDPOINT =
    "https://calm-band-0308.work123qwerty11.workers.dev/submit";

  const SITE_NAME = "CNPC CFA Partner";

  const form = document.querySelector("#applicationForm");
  const message = document.querySelector("#formMessage");
  const contactDateSelect = document.querySelector("#contactDate");

  // =========================
  // ДАТЫ: следующие 14 дней
  // =========================
  if (contactDateSelect) {
    const dayFormatter = new Intl.DateTimeFormat("ru-RU", {
      weekday: "short",
      day: "numeric",
      month: "long",
    });

    const today = new Date();

    for (let i = 1; i <= 14; i += 1) {
      const date = new Date(today);
      date.setHours(12, 0, 0, 0);
      date.setDate(today.getDate() + i);

      const value =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0");

      const label = dayFormatter.format(date);

      const option = document.createElement("option");
      option.value = value;
      option.textContent =
        label.charAt(0).toUpperCase() + label.slice(1);

      contactDateSelect.appendChild(option);
    }
  }

  // =========================
  // FAQ: открыт только один пункт
  // =========================
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

  // =========================
  // ФОРМА
  // =========================
  if (!form || !message) {
    console.error("Не найдена форма #applicationForm или #formMessage.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const button = form.querySelector('button[type="submit"]');

    if (!button) {
      console.error("Не найдена кнопка отправки формы.");
      return;
    }

    const originalButtonText = button.innerHTML;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const contact = String(formData.get("contact") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const experience = String(formData.get("experience") || "").trim();
    const income = String(formData.get("income") || "").trim();
    const contactDate = String(formData.get("contact_date") || "").trim();
    const contactTime = String(formData.get("contact_time") || "").trim();
    const website = String(formData.get("website") || "").trim();

    const consent =
      formData.get("consent") === "yes" ||
      formData.get("consent") === "on";

    button.disabled = true;
    button.textContent = "Отправляем…";

    message.textContent = "Отправляем заявку…";
    message.classList.remove("success");

    try {
      const payload = {
        // Поля, которые использовала твоя рабочая версия Worker
        name,
        contact,
        email,
        experience,
        income,
        consent,
        website,

        // Дополнительные данные формы
        contact_date: contactDate,
        contact_time: contactTime,

        // Служебные данные
        source: SITE_NAME,
        site: SITE_NAME,
        page: window.location.href,
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch(TELEGRAM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      console.log(
        "Ответ Telegram Worker:",
        response.status,
        responseText
      );

      let result = {};

      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          // Разрешаем Worker вернуть обычный текст.
        }
      }

      // Любой HTTP-код не 2xx считаем ошибкой.
      if (!response.ok) {
        throw new Error(
          result.error ||
          responseText ||
          `Ошибка Worker: HTTP ${response.status}`
        );
      }

      // Если Worker явно сообщил об ошибке — показываем её в консоли.
      if (result.ok === false || result.success === false || result.error) {
        throw new Error(
          result.error || "Worker сообщил об ошибке отправки"
        );
      }

      // Успешная отправка
      form.reset();

      message.textContent =
        "Спасибо! Заявка отправлена. Мы свяжемся с вами.";

      message.classList.add("success");
    } catch (error) {
      console.error("Ошибка отправки формы:", error);

      message.textContent =
        "Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами напрямую.";

      message.classList.remove("success");
    } finally {
      button.disabled = false;
      button.innerHTML = originalButtonText;
    }
  });
})();
