"use client";

import { Pill } from "@/components/ui/pill";
import { useCallback, useEffect, useRef, useState } from "react";

const STAR_PATH =
  "M12 2.6l2.8 5.9 6.4.9-4.7 4.5 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.5 6.4-.9z";

const WORDS = ["Poor", "Not great", "Okay", "Good", "Loved it"] as const;

const DRAFT =
  "Wonderful dinner at Cafe Nova. The pasta was perfect and the service was warm. I’d happily come back.";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div
      className="star-row"
      role="img"
      aria-label={
        rating > 0 ? `${rating} out of 5 stars` : "Rating animation preview"
      }
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <span
          key={value}
          className={`ds star-display${value <= rating ? " on" : ""}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24">
            <path d={STAR_PATH} />
          </svg>
        </span>
      ))}
    </div>
  );
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function HeroDemo() {
  const [rating, setRating] = useState(0);
  const [word, setWord] = useState("Watch the demo…");
  const [showNote, setShowNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("1 star at Table 7");
  const [resultHtml, setResultHtml] = useState(
    "This preview runs automatically.",
  );
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runIdRef = useRef(0);

  const clearTypewriter = useCallback(() => {
    if (typeTimerRef.current) {
      clearInterval(typeTimerRef.current);
      typeTimerRef.current = null;
    }
  }, []);

  const applyRating = useCallback(
    (v: number) => {
      clearTypewriter();

      if (v <= 0) {
        setRating(0);
        setShowNote(false);
        setWord("Watch the demo…");
        setResultHtml("This preview runs automatically.");
        return;
      }

      setRating(v);
      setShowNote(v < 3);
      setNoteTitle(`${v}${v > 1 ? " stars" : " star"} at Table 7`);
      setWord(WORDS[v - 1]);

      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (v < 3) {
        setResultHtml(
          "<b>We’re sorry that happened.</b><br>We’ve told the manager. Someone will be right over.",
        );
        return;
      }

      if (reduce) {
        setResultHtml(
          `<b>Glad you enjoyed it!</b><br>Your review draft:<br><i>${DRAFT}</i>`,
        );
        return;
      }

      setResultHtml(
        "<b>Glad you enjoyed it!</b><br>Your review draft:<br><i></i>",
      );
      let k = 0;
      typeTimerRef.current = setInterval(() => {
        k += 2;
        const slice = DRAFT.slice(0, k);
        setResultHtml(
          `<b>Glad you enjoyed it!</b><br>Your review draft:<br><i>${slice}</i>`,
        );
        if (k >= DRAFT.length) clearTypewriter();
      }, 22);
    },
    [clearTypewriter],
  );

  useEffect(() => {
    const runId = ++runIdRef.current;
    let cancelled = false;

    async function loop() {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const idleMs = reduce ? 600 : 1400;
      const lowHoldMs = reduce ? 2800 : 4800;
      const highHoldMs = reduce ? 3200 : 7200;
      const resetMs = reduce ? 400 : 900;

      while (!cancelled && runIdRef.current === runId) {
        applyRating(0);
        await sleep(idleMs);
        if (cancelled || runIdRef.current !== runId) return;

        applyRating(1);
        await sleep(lowHoldMs);
        if (cancelled || runIdRef.current !== runId) return;

        applyRating(0);
        await sleep(resetMs);
        if (cancelled || runIdRef.current !== runId) return;

        applyRating(5);
        await sleep(highHoldMs);
      }
    }

    void loop();

    return () => {
      cancelled = true;
      clearTypewriter();
    };
  }, [applyRating, clearTypewriter]);

  return (
    <div
      className="stage"
      id="demo"
      aria-label="Automatic demo: low rating alert, then a happy review draft"
    >
      <div className="stage-heading">
        <span className="stage-kicker">LIVE PRODUCT PREVIEW</span>
        <span className="stage-live">
          <i aria-hidden="true" />
          AUTO DEMO
        </span>
      </div>
      <div className="slot">
        <div
          className="manager-device"
          aria-label="Manager phone alert preview"
        >
          <div className="manager-screen">
            <div className="manager-topline">
              <span>SCANREVIEW ALERTS</span>
              <span className="manager-status">LIVE</span>
            </div>
            <div className="wait">Manager’s phone</div>
            <div
              className={`note${showNote ? " show" : ""}`}
              role="status"
            >
              <span className="mark">★</span>
              <div>
                <b>{noteTitle}</b>
                <small>Cafe Nova · Go check on them now</small>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="ph">
        <Pill>Table 7 · Cafe Nova</Pill>
        <h3>How was your visit?</h3>
        <StarDisplay rating={rating} />
        <b id="dw">{word}</b>
        <div
          className="res"
          id="res"
          aria-live="polite"
          dangerouslySetInnerHTML={{ __html: resultHtml }}
        />
      </div>
    </div>
  );
}
