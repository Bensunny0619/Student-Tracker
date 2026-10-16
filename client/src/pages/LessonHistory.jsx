
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock3,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

function formatLessonDate(value) {
  if (!value) return "Date unavailable";

  // Use the calendar date without timezone conversion.
  const datePart = String(value).slice(0, 10);
  const date = new Date(`${datePart}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return datePart;
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function LessonHistory() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchLessons() {
      try {
        const response = await fetch(
          `/api/students/${id}/lessons`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load lesson history"
          );
        }

        setStudent(data.student);
        setLessons(data.lessons);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchLessons();

    return () => controller.abort();
  }, [id]);

  
async function handleDeleteLesson(lesson) {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${lesson.topic}"?\n\nThis action cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

  setDeletingId(lesson.id);
  setError("");

  try {
    const response = await fetch(
      `/api/students/${id}/lessons/${lesson.id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to delete lesson"
      );
    }

    // Remove the deleted lesson from the screen
    setLessons((previousLessons) =>
      previousLessons.filter(
        (item) => item.id !== lesson.id
      )
    );
  } catch (err) {
    setError(err.message);
  } finally {
    setDeletingId(null);
  }
}


  if (loading) {
    return (
      <main className="students-page">
        <p>Loading lesson history...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="students-page">
        <p className="error-message" role="alert">
          {error}
        </p>
        <Link to="/students">Back to students</Link>
      </main>
    );
  }

  return (
    <main className="students-page">
      <Link to="/students" className="back-link">
        <ArrowLeft size={18} />
        Back to students
      </Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">LESSON MANAGEMENT</p>
          <h1>Lesson History</h1>
          <p>
            {student?.first_name} · Grade {student?.grade}
          </p>
        </div>

        <Link
          to={`/students/${id}/lessons/new`}
          className="primary-link"
        >
          <Plus size={18} />
          Log Lesson
        </Link>
      </div>

      {error && (
  <p className="error-message" role="alert">
    {error}
  </p>
)}

      <p className="student-results-count">
        {lessons.length} recorded{" "}
        {lessons.length === 1 ? "lesson" : "lessons"}
      </p>

      {lessons.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={38} />
          <h2>No lessons recorded yet</h2>
          <p>
            Log the first tutoring session for this student.
          </p>
        </div>
      ) : (
        <div className="lesson-list">
          {lessons.map((lesson) => (
            <article className="lesson-card" key={lesson.id}>
              <div className="lesson-card-header">
                <div>
                  <h2>{lesson.topic}</h2>
                  <p>{lesson.subject}</p>
                </div>
              </div>

              <div className="lesson-meta">
                <span>
                  <CalendarDays size={16} />
                  {formatLessonDate(lesson.lesson_date)}
                </span>

                <span>
                  <Clock3 size={16} />
                  {lesson.duration_minutes} minutes
                </span>
              </div>

              
<div className="lesson-actions">
  <Link
    to={`/students/${id}/lessons/${lesson.id}/edit`}
    className="edit-lesson-link"
  >
    <Pencil size={16} />
    Edit Lesson
  </Link>

  <button
    type="button"
    className="delete-lesson-button"
    onClick={() => handleDeleteLesson(lesson)}
    disabled={deletingId !== null}
  >
    <Trash2 size={16} />
    {deletingId === lesson.id
      ? "Deleting..."
      : "Delete Lesson"}
  </button>
</div>


              {lesson.lesson_notes && (
                <div className="lesson-detail">
                  <h3>Lesson Notes</h3>
                  <p>{lesson.lesson_notes}</p>
                </div>
              )}

              {lesson.homework && (
                <div className="lesson-detail">
                  <h3>Homework Assigned</h3>
                  <p>{lesson.homework}</p>
                </div>
              )}

              {lesson.performance_notes && (
                <div className="lesson-detail">
                  <h3>Performance Observations</h3>
                  <p>{lesson.performance_notes}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
