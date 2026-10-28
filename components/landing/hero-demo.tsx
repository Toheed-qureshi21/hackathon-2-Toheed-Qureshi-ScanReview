"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STAR_PATH =
  "M12 2.6l2.8 5.9 6.4.9-4.7 4.5 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.5 6.4-.9z";

const WORDS = ["Poor", "Not great", "Okay", "Good", "Loved it"] as const;

const DRAFT =
  "Wonderful dinner at Cafe Nova. The pasta was perfect and the service was warm. I’d happily come back.";

function StarButton({
  value,
  selected,
  onSelect,
}: {
  value: number;
  selected: number;
  onSelect: (v: number) => void;
}) {
  const filled = value <= selected;
  const label = `${value} star${value > 1 ? "s" : ""}`;
  return (
    <button
      type="button"
      className={`ds${filled ? " on" : ""}`}
      role="radio"
      aria-checked={selected === value}
      aria-label={label}
      onClick={() => onSelect(value)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={STAR_PATH} />
      </svg>
    </button>
  );
}

export function HeroDemo() {
  const [rating, setRating] = useState(0);
  const [word, setWord] = useState("Tap a star to try it");
  const [showNote, setShowNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("1 star at Table 7");
  const [resultHtml, setResultHtml] = useState(
    "Your tap here is only a demo.",
  );
  const usedRef = useRef(false);
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pick = useCallback((v: number) => {
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    setRating(v);
    setShowNote(v < 3);
    setNoteTitle(
      `${v}${v > 1 ? " stars" : " star"} at Table 7`,
    );
    setWord(WORDS[v - 1]);

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (v < 3) {
      setResultHtml(
        "<b>We’re sorry that happened.</b><br>We’ve told the manager. Someone will be right over.",
      );
    } else {
      if (reduce) {
        setResultHtml(
          `<b>Glad you enjoyed it!</b><br>Your review draft:<br><i>${DRAFT}</i>`,
        );
      } else {
        setResultHtml(
          "<b>Glad you enjoyed it!</b><br>Your review draft:<br><i id=\"ty\"></i>",
        );
        let k = 0;
        typeTimerRef.current = setInterval(() => {
          k += 2;
          const slice = DRAFT.slice(0, k);
          setResultHtml(
            `<b>Glad you enjoyed it!</b><br>Your review draft:<br><i>${slice}</i>`,
          );
          if (k >= DRAFT.length && typeTimerRef.current) {
            clearInterval(typeTimerRef.current);
          }
        }, 22);
      }
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!usedRef.current) pick(1);
    }, 1400);
    return () => {
      clearTimeout(t);
      if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    };
  }, [pick]);

  function handleSelect(v: number) {
    usedRef.current = true;
    pick(v);
  }

  return (
    <div className="stage" id="demo" aria-label="Interactive demo: rate a visit and watch the manager alert">
      <div className="stage-heading">
        <span className="stage-kicker">LIVE PRODUCT PREVIEW</span>
        <span className="stage-live">
          <i aria-hidden="true" />
          INTERACTIVE DEMO
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
        <span className="pill">Table 7 · Cafe Nova</span>
        <h3>How was your visit?</h3>
        <div role="radiogroup" aria-label="Rating" className="star-row">
          {[1, 2, 3, 4, 5].map((v) => (
            <StarButton
              key={v}
              value={v}
              selected={rating}
              onSelect={handleSelect}
            />
          ))}
        </div>
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
