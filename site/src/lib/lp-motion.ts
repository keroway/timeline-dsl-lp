export function initCopyButtons(): void {
  const copyButtons = document.querySelectorAll("[data-copy-target]");

  const copyText = async (text: string): Promise<boolean> => {
    if (navigator.clipboard?.writeText) {
      try {
        await Promise.race([
          navigator.clipboard.writeText(text),
          new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error("Clipboard write timed out")), 800);
          }),
        ]);
        return true;
      } catch {
        // Fall through to the selection-based fallback for restricted browsers.
      }
    }

    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-999px";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();

    try {
      const legacyCopy = (document as unknown as { execCommand: (command: string) => boolean })
        .execCommand;
      return legacyCopy.call(document, "copy");
    } finally {
      field.remove();
    }
  };

  copyButtons.forEach((button) => {
    const targetId = button.getAttribute("data-copy-target");
    const target = targetId ? document.getElementById(targetId) : null;
    const successLabel = button.getAttribute("data-copy-success-label") || "コピーしました";
    const errorLabel = button.getAttribute("data-copy-error-label") || "コピーに失敗しました";
    const status = button.parentElement?.querySelector(".copy-status");
    let resetTimer: number | undefined;
    const setStatus = (message: string) => {
      if (status) status.textContent = message;
    };

    button.addEventListener("click", async () => {
      if (!target?.textContent) return;

      const didCopy = await copyText(target.textContent.trim());

      if (didCopy) {
        button.classList.add("is-copied");
        setStatus(successLabel);
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          button.classList.remove("is-copied");
          setStatus("");
        }, 1800);
      } else {
        setStatus(errorLabel);
      }
    });
  });
}

export function initMotion(): void {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motionAllowed =
    !motionQuery.matches && !document.documentElement.hasAttribute("data-a11y-reduced-motion");

  if (motionAllowed && document.querySelector(".command-strip__command")) {
    document.body.classList.add("cli-strip-motion-enabled");
  }

  if (motionAllowed && document.querySelector(".editor-panel")) {
    document.body.classList.add("hero-editor-motion-enabled");
  }

  if (motionAllowed && "IntersectionObserver" in window) {
    const revealGroups = [
      { selector: ".section-header", delayStep: 80 },
      { selector: ".feature", delayStep: 120 },
      { selector: ".workflow-step", delayStep: 130 },
      { selector: ".usecase", delayStep: 90 },
    ];
    const revealTargets: HTMLElement[] = [];

    revealGroups.forEach(({ selector, delayStep }) => {
      document.querySelectorAll<HTMLElement>(selector).forEach((target, index) => {
        target.style.setProperty("--reveal-delay", `${index * delayStep}ms`);
        revealTargets.push(target);
      });
    });

    if (revealTargets.length > 0) {
      document.body.classList.add("scroll-reveal-enabled");
      const revealTarget = (target: HTMLElement) => {
        target.classList.add("is-visible");
        revealObserver.unobserve(target);
      };

      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            revealTarget(entry.target as HTMLElement);
          });
        },
        {
          rootMargin: "0px 0px -12% 0px",
          threshold: 0.12,
        },
      );

      let revealFrame = 0;
      const revealPassedTargets = () => {
        revealFrame = 0;
        const triggerLine = window.innerHeight * 0.88;

        revealTargets.forEach((target) => {
          if (target.classList.contains("is-visible")) return;

          const rect = target.getBoundingClientRect();
          if (rect.top <= triggerLine) {
            revealTarget(target);
          }
        });
      };
      const queueRevealCheck = () => {
        if (revealFrame) return;
        revealFrame = window.requestAnimationFrame(revealPassedTargets);
      };

      revealTargets.forEach((target) => {
        target.addEventListener(
          "animationend",
          () => {
            target.classList.add("is-revealed");
          },
          { once: true },
        );
        revealObserver.observe(target);
      });
      window.addEventListener("scroll", queueRevealCheck, { passive: true });
      window.addEventListener("resize", queueRevealCheck);
      queueRevealCheck();
    }
  }
}
