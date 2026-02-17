import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { StoryBook } from "../api/publicApi";
import { fetchPublicBooks } from "../api/publicApi";
import { mockStories } from "../mock/stories";
import type { Story } from "../mock/stories";
import "../styles/pages/StoryReader.css";

const FOCUS_SESSION_OPTIONS = [8, 10, 12];
const OFFSCREEN_MISSIONS = [
  "Look out a window and name 3 things you notice.",
  "Stretch your hands and shoulders for 30 seconds.",
  "Tell a parent one thing you liked in this story.",
  "Take 5 deep breaths before the next page.",
];

const toStory = (book: StoryBook): Story => {
  const pages =
    book.pages && book.pages.length > 0
      ? [...book.pages]
          .sort((a, b) => a.pageNumber - b.pageNumber)
          .map((page) => ({
            index: page.pageNumber,
            imageUrl: page.imageUrl,
            text: page.text || "Let us read this page together.",
          }))
      : [
          {
            index: 1,
            imageUrl: book.coverUrl || "https://picsum.photos/seed/hkids-fallback/1200/800",
            text: book.description || "A beautiful story is waiting for you.",
          },
        ];

  return {
    id: book._id,
    title: book.title,
    pages,
  };
};

const formatDuration = (totalSeconds: number): string => {
  const safe = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

function StoryReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [story, setStory] = useState<Story | null>(null);
  const [pageCursor, setPageCursor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(10);
  const [focusSecondsRemaining, setFocusSecondsRemaining] = useState(10 * 60);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [breakPromptVisible, setBreakPromptVisible] = useState(false);
  const [activeMission, setActiveMission] = useState<string | null>(null);
  const [completedFocusCycles, setCompletedFocusCycles] = useState(0);
  const [isCalmMode, setIsCalmMode] = useState(false);
  const [textScale, setTextScale] = useState(1);
  const [lineSpacing, setLineSpacing] = useState(1.65);
  const [retellAnswer, setRetellAnswer] = useState<"yes" | "again" | null>(null);
  const [feelingAnswer, setFeelingAnswer] = useState<"happy" | "calm" | "curious" | "brave" | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    const loadStory = async () => {
      setLoading(true);
      setNotFound(false);
      setStory(null);
      setPageCursor(0);
      setRetellAnswer(null);
      setFeelingAnswer(null);

      if (!id) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      try {
        const books = await fetchPublicBooks({});
        const foundBook = books.find((book) => book._id === id);
        if (foundBook) {
          if (!cancelled) {
            setStory(toStory(foundBook));
            setLoading(false);
          }
          return;
        }
      } catch {
        // fallback to mock data below
      }

      const fallbackStory = mockStories.find((item) => item.id === id);
      if (!cancelled) {
        if (fallbackStory) {
          setStory(fallbackStory);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      }
    };

    void loadStory();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const totalPages = story?.pages.length ?? 0;
  const currentPage = useMemo(() => story?.pages[pageCursor], [story, pageCursor]);
  const onLastPage = pageCursor === totalPages - 1 && totalPages > 0;

  const resetFocusSession = useCallback(() => {
    setFocusSecondsRemaining(focusMinutes * 60);
    setBreakPromptVisible(false);
    setSessionPaused(false);
    setActiveMission(null);
  }, [focusMinutes]);

  useEffect(() => {
    resetFocusSession();
    setCompletedFocusCycles(0);
  }, [id, resetFocusSession]);

  useEffect(() => {
    setFocusSecondsRemaining(focusMinutes * 60);
  }, [focusMinutes]);

  useEffect(() => {
    if (!story || sessionPaused || breakPromptVisible) {
      return;
    }

    const interval = window.setInterval(() => {
      setFocusSecondsRemaining((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [story, sessionPaused, breakPromptVisible]);

  useEffect(() => {
    if (!story || breakPromptVisible || focusSecondsRemaining > 0) {
      return;
    }

    const mission = OFFSCREEN_MISSIONS[Math.floor(Math.random() * OFFSCREEN_MISSIONS.length)];
    setActiveMission(mission);
    setBreakPromptVisible(true);
    setSessionPaused(true);
  }, [story, focusSecondsRemaining, breakPromptVisible]);

  const completeBreakAndContinue = () => {
    setCompletedFocusCycles((count) => count + 1);
    setBreakPromptVisible(false);
    setSessionPaused(false);
    setFocusSecondsRemaining(focusMinutes * 60);
    setActiveMission(null);
  };

  const readerStyle = useMemo(
    () =>
      ({
        "--reader-text-scale": String(textScale),
        "--reader-line-height": String(lineSpacing),
      }) as CSSProperties,
    [textScale, lineSpacing]
  );

  if (loading) {
    return (
      <main className="story-reader-screen">
        <button type="button" className="reader-back-btn" onClick={() => navigate("/")}>
          Back
        </button>
        <div className="reader-empty-state">Loading story...</div>
      </main>
    );
  }

  if (notFound || !story) {
    return (
      <main className="story-reader-screen">
        <div className="reader-center-box">
          <h1>Story not found</h1>
          <button type="button" className="reader-back-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={`story-reader-screen ${isCalmMode ? "calm-mode" : ""}`} style={readerStyle}>
      <header className="reader-header">
        <button type="button" className="reader-back-btn" onClick={() => navigate("/")}>
          Back
        </button>
        <h1>{story.title}</h1>
      </header>

      <section className="reader-utility-panel">
        <div className="reader-focus-chip" aria-live="polite">
          Focus time left: <strong>{formatDuration(focusSecondsRemaining)}</strong>
        </div>
        <div className="reader-utility-actions">
          <button type="button" className="reader-nav-btn secondary" onClick={() => setSessionPaused((v) => !v)}>
            {sessionPaused ? "Resume Session" : "Pause Session"}
          </button>
          <button type="button" className="reader-nav-btn secondary" onClick={resetFocusSession}>
            Restart Timer
          </button>
          <label className="reader-select">
            <span>Session</span>
            <select value={focusMinutes} onChange={(event) => setFocusMinutes(Number(event.target.value))}>
              {FOCUS_SESSION_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </select>
          </label>
          <label className="reader-select">
            <span>Text Size</span>
            <select value={textScale} onChange={(event) => setTextScale(Number(event.target.value))}>
              <option value={0.95}>Small</option>
              <option value={1}>Standard</option>
              <option value={1.15}>Large</option>
            </select>
          </label>
          <label className="reader-select">
            <span>Spacing</span>
            <select value={lineSpacing} onChange={(event) => setLineSpacing(Number(event.target.value))}>
              <option value={1.55}>Compact</option>
              <option value={1.65}>Standard</option>
              <option value={1.85}>Relaxed</option>
            </select>
          </label>
          <button type="button" className="reader-nav-btn secondary" onClick={() => setIsCalmMode((value) => !value)}>
            {isCalmMode ? "Standard Mode" : "Calm Mode"}
          </button>
        </div>
      </section>

      {breakPromptVisible && (
        <section className="reader-break-card" role="status" aria-live="polite">
          <h2>Time for an off-screen break</h2>
          <p>Great focus. Pause your eyes and do one quick offline mission before the next reading cycle.</p>
          {activeMission && <p className="reader-mission">{activeMission}</p>}
          <div className="reader-break-actions">
            <button type="button" className="reader-nav-btn" onClick={completeBreakAndContinue}>
              I did the mission
            </button>
            <button type="button" className="reader-nav-btn secondary" onClick={() => setBreakPromptVisible(false)}>
              Continue later
            </button>
          </div>
        </section>
      )}

      <section className="reader-stage">
        <img src={currentPage?.imageUrl} alt={`Page ${currentPage?.index}`} />
      </section>

      <p className="reader-paragraph">{currentPage?.text}</p>

      {onLastPage && (
        <section className="reader-coach" aria-label="Comprehension coach">
          <h2>Comprehension Check</h2>
          <p>Take 30 seconds to remember what you read.</p>
          <div className="reader-coach-row">
            <span>Can you retell the story in your own words?</span>
            <div>
              <button
                type="button"
                className={retellAnswer === "yes" ? "reader-nav-btn active" : "reader-nav-btn secondary"}
                onClick={() => setRetellAnswer("yes")}
              >
                Yes, I can
              </button>
              <button
                type="button"
                className={retellAnswer === "again" ? "reader-nav-btn active" : "reader-nav-btn secondary"}
                onClick={() => {
                  setRetellAnswer("again");
                  setPageCursor(0);
                }}
              >
                Read again
              </button>
            </div>
          </div>
          <div className="reader-coach-row">
            <span>How did the story feel?</span>
            <div>
              {(["happy", "calm", "curious", "brave"] as const).map((feeling) => (
                <button
                  key={feeling}
                  type="button"
                  className={feelingAnswer === feeling ? "reader-nav-btn active" : "reader-nav-btn secondary"}
                  onClick={() => setFeelingAnswer(feeling)}
                >
                  {feeling}
                </button>
              ))}
            </div>
          </div>
          {retellAnswer && feelingAnswer && (
            <p className="reader-coach-success">
              Nice effort. Tell a parent one detail you remember before the next session.
            </p>
          )}
        </section>
      )}

      <footer className="reader-nav">
        <button
          type="button"
          className="reader-nav-btn"
          onClick={() => setPageCursor((cursor) => Math.max(0, cursor - 1))}
          disabled={pageCursor === 0 || breakPromptVisible}
        >
          Previous
        </button>
        <span>
          Page {pageCursor + 1} / {totalPages} | Focus cycles today: {completedFocusCycles}
        </span>
        <button
          type="button"
          className="reader-nav-btn"
          onClick={() => setPageCursor((cursor) => Math.min(totalPages - 1, cursor + 1))}
          disabled={pageCursor === totalPages - 1 || breakPromptVisible}
        >
          Next
        </button>
      </footer>
    </main>
  );
}

export default StoryReader;
