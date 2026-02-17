import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchPublicBooks, fetchPublicCategories } from "../api/publicApi";
import type { BookLanguage, StoryBook, StoryCategory } from "../api/publicApi";
import StoryCover from "./StoryCover";

import "../styles/pages/PublicReader.css";

const AGE_FILTERS: Array<{ label: string; value: number | "all" }> = [
  { label: "All Ages", value: "all" },
  { label: "Age 3+", value: 3 },
  { label: "Age 5+", value: 5 },
  { label: "Age 7+", value: 7 },
  { label: "Age 9+", value: 9 },
  { label: "Age 12+", value: 12 },
];

const LANGUAGE_FILTERS: Array<{ label: string; value: BookLanguage | "all" }> = [
  { label: "All Languages", value: "all" },
  { label: "English", value: "en" },
  { label: "French", value: "fr" },
  { label: "Arabic", value: "ar" },
];

const LANGUAGE_LABELS: Record<BookLanguage, string> = {
  en: "English",
  fr: "French",
  ar: "Arabic",
};

function PublicReader() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<StoryBook[]>([]);
  const [categories, setCategories] = useState<StoryCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAge, setSelectedAge] = useState<number | "all">("all");
  const [selectedLanguage, setSelectedLanguage] = useState<BookLanguage | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadSignal, setReloadSignal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await fetchPublicCategories();
        if (!cancelled) {
          setCategories(data);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    };

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadBooks = async () => {
      setLoadingBooks(true);
      setErrorMessage(null);

      try {
        const data = await fetchPublicBooks({
          age: selectedAge === "all" ? undefined : selectedAge,
          lang: selectedLanguage === "all" ? undefined : selectedLanguage,
          category: selectedCategory === "all" ? undefined : selectedCategory,
        });
        if (!cancelled) {
          setBooks(data);
        }
      } catch (error) {
        if (!cancelled) {
          setBooks([]);
          setErrorMessage(error instanceof Error ? error.message : "Could not load stories.");
        }
      } finally {
        if (!cancelled) {
          setLoadingBooks(false);
        }
      }
    };

    void loadBooks();
    return () => {
      cancelled = true;
    };
  }, [selectedAge, selectedLanguage, selectedCategory, reloadSignal]);

  const fallbackCategories = useMemo(() => {
    const mappedCategories = new Map<string, StoryCategory>();
    books.forEach((book) => {
      book.categories.forEach((category) => {
        mappedCategories.set(category._id, category);
      });
    });
    return [...mappedCategories.values()];
  }, [books]);

  const categoryOptions = categories.length > 0 ? categories : fallbackCategories;

  const filteredBooks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return books;
    }

    return books.filter((book) => {
      const categoriesText = book.categories.map((category) => category.name).join(" ");
      const searchableText = `${book.title} ${book.description} ${categoriesText}`.toLowerCase();
      return searchableText.includes(normalizedSearch);
    });
  }, [books, searchTerm]);

  const selectedBook = useMemo(
    () => books.find((book) => book._id === selectedBookId) ?? null,
    [books, selectedBookId]
  );

  const activePage = selectedBook?.pages[activePageIndex];
  const totalPages = selectedBook?.pages.length ?? 0;
  const featuredBook = filteredBooks[0] ?? null;
  const storiesWithPages = filteredBooks.filter((book) => book.pages.length > 0).length;

  useEffect(() => {
    setActivePageIndex(0);
  }, [selectedBookId]);

  useEffect(() => {
    if (!selectedBookId) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedBookId(null);
      }

      if (event.key === "ArrowRight" && totalPages > 0) {
        setActivePageIndex((current) => Math.min(totalPages - 1, current + 1));
      }

      if (event.key === "ArrowLeft" && totalPages > 0) {
        setActivePageIndex((current) => Math.max(0, current - 1));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedBookId, totalPages]);

  return (
    <div className="reading-world">
      <div className="sky-bubble sky-bubble-one" aria-hidden="true" />
      <div className="sky-bubble sky-bubble-two" aria-hidden="true" />
      <div className="sky-bubble sky-bubble-three" aria-hidden="true" />

      <header className="reading-hero">
        <div className="reading-hero-copy">
          <p className="hero-label">HKids Reading Club</p>
          <h1>Read, Imagine, and Grow One Story at a Time</h1>
          <p className="hero-subtitle">
            A playful story library for children. Discover age-friendly books, choose a language,
            and open each story in a focused reading mode.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="hero-action primary"
              onClick={() => setSelectedAge(5)}
            >
              Start with Age 5+
            </button>
            <button
              type="button"
              className="hero-action secondary"
              onClick={() => setReloadSignal((value) => value + 1)}
            >
              Reload Stories
            </button>
          </div>
        </div>

        <div className="reading-stats">
          <article>
            <p>Stories</p>
            <strong>{filteredBooks.length}</strong>
          </article>
          <article>
            <p>With Pages</p>
            <strong>{storiesWithPages}</strong>
          </article>
          <article>
            <p>Categories</p>
            <strong>{categoryOptions.length}</strong>
          </article>
        </div>
      </header>

      <section className="reader-controls-panel">
        <label className="search-input" htmlFor="story-search">
          <span>Find a story</span>
          <input
            id="story-search"
            type="search"
            placeholder="Try: animals, friendship, stars..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <div className="filter-group">
          <p>Age Group</p>
          <div className="pill-row">
            {AGE_FILTERS.map((filter) => (
              <button
                key={filter.label}
                className={selectedAge === filter.value ? "pill active" : "pill"}
                onClick={() => setSelectedAge(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <p>Language</p>
          <div className="pill-row">
            {LANGUAGE_FILTERS.map((filter) => (
              <button
                key={filter.label}
                className={selectedLanguage === filter.value ? "pill active" : "pill"}
                onClick={() => setSelectedLanguage(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="category-ribbon" aria-label="Category filters">
        <button
          className={selectedCategory === "all" ? "category-chip active" : "category-chip"}
          onClick={() => setSelectedCategory("all")}
          type="button"
        >
          All Categories
        </button>
        {loadingCategories && <span className="category-status">Loading categories...</span>}
        {!loadingCategories &&
          categoryOptions.map((category) => (
            <button
              key={category._id}
              className={selectedCategory === category._id ? "category-chip active" : "category-chip"}
              onClick={() => setSelectedCategory(category._id)}
              type="button"
            >
              {category.name}
            </button>
          ))}
      </section>

      <main className="reader-layout">
        <section className="featured-story">
          <div className="featured-heading">
            <h2>Featured Pick</h2>
            <p>Today&apos;s spotlight for young readers.</p>
          </div>

          {!loadingBooks && !errorMessage && featuredBook && (
            <article className="featured-card">
              <StoryCover coverUrl={featuredBook.coverUrl} title={featuredBook.title} />
              <div className="featured-content">
                <p className="story-language">{LANGUAGE_LABELS[featuredBook.language]}</p>
                <h3>{featuredBook.title}</h3>
                <p className="story-description">
                  {featuredBook.description || "A joyful story for reading time."}
                </p>
                <p className="story-meta">
                  Ages {featuredBook.minAge}-{featuredBook.maxAge}
                </p>
                <button
                  type="button"
                  className="read-button"
                  onClick={() => setSelectedBookId(featuredBook._id)}
                >
                  Read Featured Story
                </button>
              </div>
            </article>
          )}

          {!loadingBooks && !errorMessage && !featuredBook && (
            <div className="state-card">No featured story with current filters.</div>
          )}
        </section>

        <section className="stories-section">
          <div className="stories-header">
            <h2>Story Library</h2>
            <button className="ghost-button" type="button" onClick={() => setReloadSignal((v) => v + 1)}>
              Refresh
            </button>
          </div>

          {loadingBooks && <div className="state-card">Loading stories...</div>}

          {!loadingBooks && errorMessage && (
            <div className="state-card error">
              <p>{errorMessage}</p>
              <button className="retry-button" type="button" onClick={() => setReloadSignal((v) => v + 1)}>
                Try again
              </button>
            </div>
          )}

          {!loadingBooks && !errorMessage && filteredBooks.length === 0 && (
            <div className="state-card">No stories match these filters yet.</div>
          )}

          {!loadingBooks && !errorMessage && filteredBooks.length > 0 && (
            <ul className="story-grid">
              {filteredBooks.map((book) => (
                <li key={book._id} className="story-card">
                  <StoryCover coverUrl={book.coverUrl} title={book.title} />
                  <div className="story-card-content">
                    <p className="story-language">{LANGUAGE_LABELS[book.language]}</p>
                    <h3>{book.title}</h3>
                    <p className="story-description">{book.description || "A gentle story to enjoy together."}</p>
                    <p className="story-meta">
                      Ages {book.minAge}-{book.maxAge}
                    </p>
                    <p className="story-meta">
                      {book.categories.length > 0
                        ? book.categories.map((category) => category.name).join(" | ")
                        : "General"}
                    </p>
                    <button
                      type="button"
                      className="read-button"
                      onClick={() => navigate(`/stories/${book._id}`)}
                    >
                      Open Story
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {selectedBook && (
        <div className="reader-overlay" role="dialog" aria-modal="true" aria-label={selectedBook.title}>
          <div className="reader-modal">
            <button className="close-reader" onClick={() => setSelectedBookId(null)} type="button">
              Close
            </button>

            <div className="reader-top">
              <div>
                <p className="reader-language">{LANGUAGE_LABELS[selectedBook.language]}</p>
                <h3>{selectedBook.title}</h3>
                <p>{selectedBook.description}</p>
              </div>
            </div>

            {totalPages > 0 ? (
              <>
                <div className="reader-page">
                  <img src={activePage?.imageUrl} alt={`Page ${activePage?.pageNumber}`} />
                </div>
                <p className="reader-text">{activePage?.text || "Enjoy the artwork and imagine the scene."}</p>
                <div className="reader-controls">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setActivePageIndex((index) => Math.max(0, index - 1))}
                    disabled={activePageIndex === 0}
                  >
                    Previous
                  </button>
                  <span>
                    Page {activePageIndex + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setActivePageIndex((index) => Math.min(totalPages - 1, index + 1))}
                    disabled={activePageIndex === totalPages - 1}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div className="reader-empty">
                <p>No page content has been added to this story yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicReader;