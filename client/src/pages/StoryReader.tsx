import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { StoryBook } from "../api/publicApi";
import { fetchPublicBookById } from "../api/publicApi";
import { getStoredReaderSession } from "../utils/readerSession";
import "../styles/pages/StoryReader.css";

type Story = {
  id: string;
  title: string;
  pages: Array<{
    index: number;
    imageUrl: string;
    text: string;
    hasImage: boolean;
    hasText: boolean;
  }>;
};

const DEFAULT_FOCUS_SECONDS = 10 * 60;

const toStory = (book: StoryBook): Story => {
  const pages =
    book.pages && book.pages.length > 0
      ? [...book.pages]
          .sort((a, b) => a.pageNumber - b.pageNumber)
          .map((page) => {
            const imageUrl = page.imageUrl?.trim() ?? "";
            const text = page.text?.trim() ?? "";

            return {
              index: page.pageNumber,
              imageUrl,
              text,
              hasImage: Boolean(imageUrl),
              hasText: Boolean(text),
            };
          })
      : [
          {
            index: 1,
            imageUrl: book.coverUrl?.trim() ?? "",
            text: book.description?.trim() ?? "",
            hasImage: Boolean(book.coverUrl?.trim()),
            hasText: Boolean(book.description?.trim()),
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

const preloadImage = (url: string) => {
  if (!url) {
    return;
  }

  const image = new Image();
  image.decoding = "async";
  image.src = url;
};

function StoryReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const readerSession = useMemo(() => getStoredReaderSession(), []);
  const preloadedImagesRef = useRef<Set<string>>(new Set());

  const [story, setStory] = useState<Story | null>(null);
  const [pageCursor, setPageCursor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [focusSecondsRemaining, setFocusSecondsRemaining] = useState(DEFAULT_FOCUS_SECONDS);
  const [sessionPaused, setSessionPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadStory = async () => {
      setLoading(true);
      setNotFound(false);
      setLoadError(null);
      setStory(null);
      setPageCursor(0);
      setFocusSecondsRemaining(DEFAULT_FOCUS_SECONDS);
      setSessionPaused(false);

      if (!id) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      if (!readerSession?.deviceId) {
        if (!cancelled) {
          setLoading(false);
          setLoadError("Reader access requires child pairing. Pair a child device first.");
        }
        return;
      }

      try {
        const foundBook = await fetchPublicBookById(id, readerSession.deviceId);
        if (!cancelled) {
          setStory(toStory(foundBook));
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Could not load this story.";
          setLoadError(message);
          setNotFound(message.toLowerCase().includes("not found"));
          setStory(null);
          setLoading(false);
        }
      }
    };

    void loadStory();
    return () => {
      cancelled = true;
    };
  }, [id, readerSession?.deviceId]);

  const totalPages = story?.pages.length ?? 0;
  const currentPage = useMemo(() => story?.pages[pageCursor], [story, pageCursor]);
  const currentPageHasImage = Boolean(currentPage?.hasImage);
  const currentPageHasText = Boolean(currentPage?.hasText);

  useEffect(() => {
    preloadedImagesRef.current.clear();
  }, [story?.id]);

  useEffect(() => {
    if (!story?.pages.length) {
      return;
    }

    const targetIndexes = [pageCursor, pageCursor + 1, pageCursor - 1, pageCursor + 2];
    targetIndexes.forEach((index) => {
      if (index < 0 || index >= story.pages.length) {
        return;
      }

      const imageUrl = story.pages[index]?.imageUrl?.trim() ?? "";
      if (!imageUrl || preloadedImagesRef.current.has(imageUrl)) {
        return;
      }

      preloadedImagesRef.current.add(imageUrl);
      preloadImage(imageUrl);
    });
  }, [story, pageCursor]);

  useEffect(() => {
    if (!story || sessionPaused || focusSecondsRemaining <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setFocusSecondsRemaining((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [story, sessionPaused, focusSecondsRemaining]);

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

  if (!readerSession?.deviceId) {
    return (
      <main className="story-reader-screen">
        <div className="reader-center-box">
          <h1>Child pairing required</h1>
          <p>Open Child Reader and pair this device with a code from the parent account.</p>
          <button type="button" className="reader-back-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  if (loadError && !notFound) {
    return (
      <main className="story-reader-screen">
        <div className="reader-center-box">
          <h1>Access blocked</h1>
          <p>{loadError}</p>
          <button type="button" className="reader-back-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
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

  const maxPageIndex = Math.max(totalPages - 1, 0);

  return (
    <main className="story-reader-screen">
      <header className="reader-topbar">
        <button type="button" className="reader-back-btn" onClick={() => navigate("/")}>
          Back
        </button>
        <h1>{story.title}</h1>
      </header>

      <section className="reader-timer-row">
        <div className="reader-focus-chip" aria-live="polite">
          Focus Timer: <strong>{formatDuration(focusSecondsRemaining)}</strong>
        </div>
        <div className="reader-timer-actions">
          <button type="button" className="reader-small-btn" onClick={() => setSessionPaused((v) => !v)}>
            {sessionPaused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            className="reader-small-btn"
            onClick={() => {
              setFocusSecondsRemaining(DEFAULT_FOCUS_SECONDS);
              setSessionPaused(false);
            }}
          >
            Reset
          </button>
        </div>
      </section>

      <section className="reader-main-stage">
        <button
          type="button"
          className="reader-arrow-btn"
          onClick={() => setPageCursor((cursor) => Math.max(0, cursor - 1))}
          disabled={pageCursor === 0}
          aria-label="Previous page"
        >
          &#x2039;
        </button>

        <article className="reader-content">
          <section className="reader-stage">
            {currentPageHasImage ? (
              <img
                src={currentPage?.imageUrl}
                alt={`Page ${currentPage?.index}`}
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="reader-stage-placeholder">
                <p>{currentPageHasText ? "Text-only page" : "Image not available on this page"}</p>
              </div>
            )}
          </section>

          {currentPageHasText && <p className="reader-paragraph">{currentPage?.text}</p>}
        </article>

        <button
          type="button"
          className="reader-arrow-btn"
          onClick={() => setPageCursor((cursor) => Math.min(maxPageIndex, cursor + 1))}
          disabled={pageCursor >= maxPageIndex}
          aria-label="Next page"
        >
          &#x203A;
        </button>
      </section>

      <footer className="reader-progress">
        <input
          type="range"
          min={0}
          max={maxPageIndex}
          value={Math.min(pageCursor, maxPageIndex)}
          onChange={(event) => setPageCursor(Number(event.target.value))}
          disabled={totalPages <= 1}
          aria-label="Story progress"
        />
        <span>
          {pageCursor + 1}/{Math.max(totalPages, 1)}
        </span>
      </footer>
    </main>
  );
}

export default StoryReader;
