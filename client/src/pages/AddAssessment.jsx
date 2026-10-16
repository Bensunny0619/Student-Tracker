
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

export default function AddAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    assessment_date: getLocalDate(),
    subject: "Mathematics",
    topic: "",
    assessment_type: "Quiz",
    score: "",
    total_marks: "",
    remarks: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadStudent() {
      try {
        const response = await fetch(`/api/students/${id}`, {
          credentials: "include",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load student"
          );
        }

        setStudent(data.student);
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

    loadStudent();

    return () => controller.abort();
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  const score = Number(form.score);
  const totalMarks = Number(form.total_marks);

  const validScores =
    form.score !== "" &&
    form.total_marks !== "" &&
    Number.isInteger(score) &&
    Number.isInteger(totalMarks) &&
    score >= 0 &&
    totalMarks > 0 &&
    score <= totalMarks;

  const percentage = validScores
    ? ((score / totalMarks) * 100).toFixed(2)
    : null;

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validScores) {
      setError(
        "Enter valid marks. Score must be between 0 and total marks."
      );
      return;
    }

    setSaving(true);

    const payload = {
      assessment_date: form.assessment_date,
      subject: form.subject.trim(),
      topic: form.topic.trim(),
      assessment_type: form.assessment_type,
      score,
      total_marks: totalMarks,
      remarks: form.remarks.trim() || null,
    };

    try {
      const response = await fetch(
        `/api/students/${id}/assessments`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save assessment"
        );
      }

      setSuccess("Assessment saved successfully!");

      // Assessment History page will be built next.
      // For now, stay on the form after saving.
      setForm((previous) => ({
        ...previous,
        topic: "",
        score: "",
        total_marks: "",
        remarks: "",
      }));
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
        <p className="error-message" role="alert">
          {error || "Student not found"}
        </p>

        <Link to="/students">
          Back to students
        </Link>
      </main>
    );
  }

  return (
    <main className="students-page">
      <Link to="/students" className="back-link">
        <ArrowLeft size={18} />
        Back to Students
      </Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">
            STUDENT PERFORMANCE
          </p>

          <h1>Record Assessment</h1>

          <p>
            Recording an assessment for{" "}
            <strong>{student.first_name}</strong>
          </p>
        </div>
      </div>

      <form
        className="student-form"
        onSubmit={handleSubmit}
      >
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="success-message">
            {success}
          </p>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="assessment_date">
              Assessment Date *
            </label>

            <input
              id="assessment_date"
              name="assessment_date"
              type="date"
              value={form.assessment_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">
              Subject *
            </label>

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
            <label htmlFor="topic">
              Topic Assessed *
            </label>

            <input
              id="topic"
              name="topic"
              placeholder="e.g. Fractions"
              value={form.topic}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="assessment_type">
              Assessment Type *
            </label>

            <select
              id="assessment_type"
              name="assessment_type"
              value={form.assessment_type}
              onChange={handleChange}
              required
            >
              <option value="Quiz">Quiz</option>
              <option value="Test">Test</option>
              <option value="Exam">Exam</option>
              <option value="Assignment">
                Assignment
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="score">
              Marks Obtained *
            </label>

            <input
              id="score"
              name="score"
              type="number"
              min="0"
              step="1"
              value={form.score}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="total_marks">
              Total Possible Marks *
            </label>

            <input
              id="total_marks"
              name="total_marks"
              type="number"
              min="1"
              step="1"
              value={form.total_marks}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group form-full-width">
            <label>Calculated Percentage</label>

            <div className="assessment-percentage">
              {percentage !== null
                ? `${percentage}%`
                : "Enter marks to calculate"}
            </div>
          </div>

          <div className="form-group form-full-width">
            <label htmlFor="remarks">
              Tutor's Remarks
            </label>

            <textarea
              id="remarks"
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              placeholder="What did the student do well? What needs improvement?"
              maxLength={5000}
              rows={4}
            />
          </div>
        </div>

        <div className="form-actions">
          <Link
            to="/students"
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
              : "Save Assessment"}
          </button>
        </div>
      </form>
    </main>
  );
}
