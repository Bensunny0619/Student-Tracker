
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function LogLesson() {
  const { id, lessonId } = useParams();
const isEditing = Boolean(lessonId);
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    lesson_date: getLocalDate(),
    subject: "Mathematics",
    topic: "",
    duration_minutes: "60",
    lesson_notes: "",
    homework: "",
    performance_notes: "",
  });

 
useEffect(() => {
  const controller = new AbortController();

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/students/${id}/lessons/${lessonId}`
        : `/api/students/${id}`;

      const response = await fetch(url, {
        credentials: "include",
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load lesson");
      }

      setStudent(data.student);

      if (isEditing && data.lesson) {
        const lesson = data.lesson;

        setForm({
          lesson_date: String(lesson.lesson_date).slice(0, 10),
          subject: lesson.subject || "",
          topic: lesson.topic || "",
          duration_minutes: String(lesson.duration_minutes),
          lesson_notes: lesson.lesson_notes || "",
          homework: lesson.homework || "",
          performance_notes: lesson.performance_notes || "",
        });
      }
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

  loadData();

  return () => controller.abort();
}, [id, lessonId, isEditing]);


function handleChange(event) {
  const { name, value } = event.target;

  setForm((previous) => ({
    ...previous,
    [name]: value,
  }));
}


  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      lesson_date: form.lesson_date,
      subject: form.subject.trim(),
      topic: form.topic.trim(),
      duration_minutes: Number(form.duration_minutes),
      lesson_notes: form.lesson_notes.trim() || null,
      homework: form.homework.trim() || null,
      performance_notes: form.performance_notes.trim() || null,
    };

    try {
    
const url = isEditing
  ? `/api/students/${id}/lessons/${lessonId}`
  : `/api/students/${id}/lessons`;

const response = await fetch(url, {
  method: isEditing ? "PATCH" : "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
  body: JSON.stringify(payload),
});


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save lesson");
      }

      navigate(`/students/${id}/lessons`, {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="students-page">
        <p>Loading student information...</p>
      </main>
    );
  }

  if (!student) {
    return (
      <main className="students-page">
        <p className="error-message">
          {error || "Student not found"}
        </p>
        <Link to="/students">Back to students</Link>
      </main>
    );
  }

  return (
    <main className="students-page">
      <Link
        to={`/students/${id}/lessons`}
        className="back-link"
      >
        <ArrowLeft size={18} />
        Back to Lesson History
      </Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">LESSON MANAGEMENT</p>
          <h1>{isEditing ? "Edit Lesson" : "Log a Lesson"}</h1>
          <p>
            Recording a lesson for{" "}
            <strong>{student.first_name}</strong>
          </p>
        </div>
      </div>

      <form className="student-form" onSubmit={handleSubmit}>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="lesson_date">
              Lesson Date *
            </label>
            <input
              id="lesson_date"
              type="date"
              name="lesson_date"
              value={form.lesson_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject *</label>
            <input
              id="subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="topic">Topic Covered *</label>
            <input
              id="topic"
              name="topic"
              placeholder="e.g. Solving Linear Equations"
              value={form.topic}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="duration_minutes">
              Duration (minutes) *
            </label>
            <input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min="1"
              max="600"
              step="1"
              value={form.duration_minutes}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group form-full-width">
            <label htmlFor="lesson_notes">
              Lesson Notes
            </label>
            <textarea
              id="lesson_notes"
              name="lesson_notes"
              value={form.lesson_notes}
              onChange={handleChange}
              placeholder="What did you teach?"
              maxLength={5000}
              rows={4}
            />
          </div>

          <div className="form-group form-full-width">
            <label htmlFor="homework">
              Homework Assigned
            </label>
            <textarea
              id="homework"
              name="homework"
              value={form.homework}
              onChange={handleChange}
              placeholder="What homework was assigned?"
              maxLength={5000}
              rows={3}
            />
          </div>

          <div className="form-group form-full-width">
            <label htmlFor="performance_notes">
              Student Performance Observations
            </label>
            <textarea
              id="performance_notes"
              name="performance_notes"
              value={form.performance_notes}
              onChange={handleChange}
              placeholder="What did the student understand? What needs improvement?"
              maxLength={5000}
              rows={4}
            />
          </div>
        </div>

        <div className="form-actions">
          <Link
            to={`/students/${id}/lessons`}
            className="cancel-link"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="login-button save-button"
            disabled={saving}
          >
            <Save size={18} />
            {saving
  ? "Saving..."
  : isEditing
    ? "Update Lesson"
    : "Save Lesson"}
          </button>
        </div>
      </form>
    </main>
  );
}
