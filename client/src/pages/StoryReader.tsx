import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { StoryBook } from "../api/publicApi";
import { fetchPublicBooks } from "../api/publicApi";
import { mockStories } from "../mock/stories";
import type { Story } from "../mock/stories";
import "./StoryReader.css";

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

function StoryReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [story, setStory] = useState<Story | null>(null);
  const [pageCursor, setPageCursor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadStory = async () => {
      setLoading(true);
      setNotFound(false);
      setStory(null);
      setPageCursor(0);

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
    <main className="story-reader-screen">
      <header className="reader-header">
        <button type="button" className="reader-back-btn" onClick={() => navigate("/")}>
          Back
        </button>
        <h1>{story.title}</h1>
      </header>

      <section className="reader-stage">
        <img src={currentPage?.imageUrl} alt={`Page ${currentPage?.index}`} />
      </section>

      <p className="reader-paragraph">{currentPage?.text}</p>

      <footer className="reader-nav">
        <button
          type="button"
          className="reader-nav-btn"
          onClick={() => setPageCursor((cursor) => Math.max(0, cursor - 1))}
          disabled={pageCursor === 0}
        >
          Previous
        </button>
        <span>
          Page {pageCursor + 1} / {totalPages}
        </span>
        <button
          type="button"
          className="reader-nav-btn"
          onClick={() => setPageCursor((cursor) => Math.min(totalPages - 1, cursor + 1))}
          disabled={pageCursor === totalPages - 1}
        >
          Next
        </button>
      </footer>
    </main>
  );
}

export default StoryReader;

