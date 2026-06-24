"use client";

import { useEffect } from "react";

const countAnimationDuration = 1200;

function getCounters(root: Element) {
  const counters = Array.from(
    root.querySelectorAll<HTMLElement>("[data-count-to]"),
  );

  if (root instanceof HTMLElement && root.dataset.countTo) {
    counters.unshift(root);
  }

  return counters;
}

function getCountData(counter: HTMLElement) {
  const countTo = counter.dataset.countTo?.trim();

  if (!countTo) {
    return null;
  }

  const digits = countTo.replace(/\D/g, "");
  const value = Number.parseInt(digits, 10);

  if (Number.isNaN(value)) {
    return null;
  }

  return {
    finalText: `${counter.dataset.countPrefix ?? ""}${countTo}${
      counter.dataset.countSuffix ?? ""
    }`,
    prefix: counter.dataset.countPrefix ?? "",
    suffix: counter.dataset.countSuffix ?? "",
    value,
    width: digits.length,
  };
}

export function ScrollAnimations() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(".scroll-reveal"),
    );

    if (!elements.length) {
      return;
    }

    const countAnimationFrames = new Set<number>();

    const setCountersToZero = (root: Element) => {
      getCounters(root).forEach((counter) => {
        const countData = getCountData(counter);

        if (!countData) {
          return;
        }

        counter.textContent = `${countData.prefix}${"0".repeat(
          countData.width,
        )}${countData.suffix}`;
      });
    };

    const finishCounters = (root: Element) => {
      getCounters(root).forEach((counter) => {
        const countData = getCountData(counter);

        if (countData) {
          counter.textContent = countData.finalText;
        }
      });
    };

    const requestCountFrame = (callback: FrameRequestCallback) => {
      const frameId = window.requestAnimationFrame((timestamp) => {
        countAnimationFrames.delete(frameId);
        callback(timestamp);
      });

      countAnimationFrames.add(frameId);
    };

    const animateCounters = (root: Element) => {
      getCounters(root).forEach((counter) => {
        const countData = getCountData(counter);

        if (!countData || counter.dataset.countAnimated === "true") {
          return;
        }

        counter.dataset.countAnimated = "true";

        const startedAt = performance.now();

        const update = (timestamp: number) => {
          const progress = Math.min(
            (timestamp - startedAt) / countAnimationDuration,
            1,
          );
          const easedProgress = 1 - (1 - progress) ** 3;
          const currentValue = Math.round(countData.value * easedProgress);

          counter.textContent = `${countData.prefix}${String(
            currentValue,
          ).padStart(countData.width, "0")}${countData.suffix}`;

          if (progress < 1) {
            requestCountFrame(update);
            return;
          }

          counter.textContent = countData.finalText;
        };

        requestCountFrame(update);
      });
    };

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      elements.forEach((element) => {
        element.classList.add("is-visible");
        finishCounters(element);
      });
      return;
    }

    elements.forEach(setCountersToZero);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          animateCounters(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.14,
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      countAnimationFrames.forEach((frameId) =>
        window.cancelAnimationFrame(frameId),
      );
    };
  }, []);

  return null;
}
