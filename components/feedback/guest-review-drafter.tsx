"use client";

import { GuestFeedbackHeader } from "@/components/feedback/guest-feedback-header";
import { Button } from "@/components/ui/button";
import { useGenerateReviewDraft } from "@/hooks/mutations/use-generate-review-draft";
import { ApiClientError } from "@/lib/api/api-error";
import {
  composeDemoReviewDraft,
  REVIEW_HIGHLIGHT_KEYS,
  type ReviewHighlightKey,
} from "@/lib/feedback/demo-review-draft";
import { shouldGenerateReviewDraftLocally } from "@/lib/feedback/guest-submit-flow";
import { isPublicReviewUrl } from "@/lib/feedback/public-review-url";
import type { GuestFeedbackContext } from "@/lib/mocks/guest-feedback";
import { cn } from "@/lib/utils";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const DRAFT_MAX = 1000;
const COMMENT_MAX = 300;
const GENERATE_MS = 900;

type GuestReviewDrafterProps = {
  context: GuestFeedbackContext;
  rating: number;
  /** Optional note from query (`note`) — pre-fills “Anything else?” only. */
  initialNote?: string;
};

type GeneratePhase = "idle" | "loading" | "ready" | "error";

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
}

export function GuestReviewDrafter({
  context,
  rating,
  initialNote = "",
}: GuestReviewDrafterProps) {
  const chipsId = useId();
  const commentId = useId();
  const draftId = useId();
  const outRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const typeTimerRef = useRef<number | null>(null);

  const reducedMotion = usePrefersReducedMotion();
  const generateDraft = useGenerateReviewDraft();
  const useLocalDraft = shouldGenerateReviewDraftLocally(context.demo);
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  const postUrl = isPublicReviewUrl(context.reviewUrl)
    ? context.reviewUrl.trim()
    : null;

  const [picks, setPicks] = useState<Set<ReviewHighlightKey>>(new Set());
  const [extraComment, setExtraComment] = useState(initialNote.slice(0, COMMENT_MAX));
  const [variant, setVariant] = useState(0);
  const [phase, setPhase] = useState<GeneratePhase>("idle");
  const [draft, setDraft] = useState("");
  const [displayDraft, setDisplayDraft] = useState("");
  const [genError, setGenError] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [copyOk, setCopyOk] = useState(false);
  const [nudgePost, setNudgePost] = useState(false);
  const [copyError, setCopyError] = useState("");

  const fitDraftHeight = useCallback(() => {
    const el = draftRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    fitDraftHeight();
  }, [displayDraft, fitDraftHeight]);

  useEffect(() => {
    return () => {
      if (typeTimerRef.current) window.clearInterval(typeTimerRef.current);
    };
  }, []);

  const runTypewriter = useCallback(
    (text: string) => {
      if (typeTimerRef.current) {
        window.clearInterval(typeTimerRef.current);
        typeTimerRef.current = null;
      }
      setDraft(text);
      if (reducedMotion) {
        setDisplayDraft(text);
        fitDraftHeight();
        return;
      }
      let i = 0;
      setDisplayDraft("");
      typeTimerRef.current = window.setInterval(() => {
        i += 3;
        const slice = text.slice(0, i);
        setDisplayDraft(slice);
        if (i >= text.length && typeTimerRef.current) {
          window.clearInterval(typeTimerRef.current);
          typeTimerRef.current = null;
        }
      }, 16);
    },
    [reducedMotion, fitDraftHeight],
  );

  const revealDraft = useCallback(
    (text: string, nextVariant: number) => {
      setVariant(nextVariant);
      setPhase("ready");
      runTypewriter(text);
      requestAnimationFrame(() => {
        outRef.current?.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "nearest",
        });
      });
    },
    [reducedMotion, runTypewriter],
  );

  const generate = useCallback(async () => {
    setGenError("");
    setCopyError("");
    setPhase("loading");
    const nextVariant = variant + 1;

    if (useLocalDraft) {
      window.setTimeout(() => {
        try {
          const text = composeDemoReviewDraft({
            orgName: context.orgName,
            rating,
            picks: [...picks],
            extraComment,
            variant: nextVariant,
          });
          if (!text.trim()) {
            throw new Error("empty");
          }
          revealDraft(text, nextVariant);
        } catch {
          setGenError("Could not build a demo draft. Try again.");
          setPhase("error");
        }
      }, GENERATE_MS);
      return;
    }

    try {
      const result = await generateDraft.mutateAsync({
        organizationId: context.orgId,
        token: context.spotId,
        rating,
        comment: extraComment.trim() || null,
        highlights: [...picks],
      });
      const text = result.draft.trim();
      if (!text) {
        throw new Error("empty");
      }
      revealDraft(text, nextVariant);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Could not write a draft. Try again.";
      setGenError(message);
      setPhase("error");
    }
  }, [
    context.orgId,
    context.orgName,
    context.spotId,
    extraComment,
    generateDraft,
    picks,
    rating,
    revealDraft,
    useLocalDraft,
    variant,
  ]);

  function togglePick(key: ReviewHighlightKey) {
    setPicks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleCopy() {
    setCopyError("");
    const text = displayDraft || draft;
    if (!text.trim()) {
      setCopyError("Generate a draft first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = draftRef.current;
      if (el) {
        el.focus();
        el.select();
        try {
          document.execCommand("copy");
        } catch {
          setCopyError("Copy failed. Select the text and copy manually.");
          return;
        }
      } else {
        setCopyError("Copy failed. Select the text and copy manually.");
        return;
      }
    }
    setCopyLabel("Copied ✓");
    setCopyOk(true);
    if (postUrl) {
      setNudgePost(true);
      window.setTimeout(() => setNudgePost(false), 2000);
    }
    window.setTimeout(() => {
      setCopyLabel("Copy");
      setCopyOk(false);
    }, 2500);
  }

  function onDraftInput(value: string) {
    const next = value.slice(0, DRAFT_MAX);
    setDraft(next);
    setDisplayDraft(next);
  }

  const showOutput =
    phase === "ready" ||
    (phase === "loading" && variant >= 1) ||
    (phase === "error" && variant >= 1);
  const writing = phase === "loading";

  return (
    <>
      <GuestFeedbackHeader />
      <main id="main-content" className="wrap guest-main guest-review-main" tabIndex={-1}>
        <div className="guest-review-meta">
          <span className="pill">
            {context.orgName} · {context.spotDisplayName}
          </span>
          <span
            className="guest-review-stars"
            role="img"
            aria-label={`${rating} out of 5 stars`}
          >
            {stars}
          </span>
        </div>

        <div className="card guest-review-card">
          <h1>Turn your visit into a review</h1>
          <p className="hint guest-lead">
            Pick what stood out and we’ll write a draft. You can edit every word.
          </p>
          {useLocalDraft ? (
            <p className="hint guest-demo-tag">
              Demo: drafts are built locally from templates — not AI.
            </p>
          ) : null}

          <span className="guest-review-label" id={chipsId}>
            What stood out?
          </span>
          <div className="chips guest-review-chips" role="group" aria-labelledby={chipsId}>
            {REVIEW_HIGHLIGHT_KEYS.map((key) => {
              const checked = picks.has(key);
              return (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePick(key)}
                    disabled={writing}
                  />
                  <span>{key}</span>
                </label>
              );
            })}
          </div>

          <label htmlFor={commentId}>
            Anything else? <span className="hint">(optional)</span>
          </label>
          <textarea
            id={commentId}
            rows={3}
            maxLength={COMMENT_MAX}
            placeholder="e.g. the pasta was perfect"
            value={extraComment}
            onChange={(e) => setExtraComment(e.target.value)}
            disabled={writing}
          />

          <Button
            type="button"
            fullWidth
            className="guest-review-generate"
            disabled={writing}
            aria-busy={writing}
            onClick={() => generate()}
          >
            {writing ? (
              <>
                Writing
                <span className="writing-dots" aria-hidden="true" />
              </>
            ) : (
              "Write my review"
            )}
          </Button>

          {genError ? (
            <p className="err" role="alert">
              {genError}
            </p>
          ) : null}

          <div
            ref={outRef}
            className={cn("guest-review-out", !showOutput && "guest-review-out--hidden")}
            hidden={!showOutput}
            aria-busy={writing}
          >
            <label htmlFor={draftId}>Your draft</label>
            <textarea
              ref={draftRef}
              id={draftId}
              className="guest-review-draft"
              maxLength={DRAFT_MAX}
              value={displayDraft}
              onChange={(e) => onDraftInput(e.target.value)}
              disabled={writing}
            />
            <p className="hint guest-review-count">
              {(displayDraft || draft).length} / {DRAFT_MAX}
            </p>
            <div className="guest-review-actions">
              <div className="guest-review-acts">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={writing}
                  onClick={() => generate()}
                >
                  {writing ? (
                    <>
                      Writing
                      <span className="writing-dots" aria-hidden="true" />
                    </>
                  ) : (
                    "Rewrite"
                  )}
                </Button>
                <Button
                  type="button"
                  className={cn(copyOk && "copy-ok")}
                  disabled={writing || !(displayDraft || draft).trim()}
                  onClick={handleCopy}
                >
                  {copyLabel}
                </Button>
              </div>
              {copyError ? (
                <p className="err" role="alert">
                  {copyError}
                </p>
              ) : null}
              {postUrl ? (
                <a
                  className={cn(
                    "btn pri w guest-review-post",
                    nudgePost && "nudge",
                  )}
                  href={postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Post your review
                </a>
              ) : null}
            </div>
            <p className="hint guest-review-post-hint">
              {postUrl
                ? "Opens in a new tab. Paste your copied review there."
                : "Paste it on any review site you like."}
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
