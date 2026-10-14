
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

const initialForm = {
  first_name: "",
  grade: "",
  province: "",
  timezone: "America/Toronto",
  parent_name: "",
  parent_contact: "",
  fee: "",
  currency: "CAD",
  status: "active",
};

export default function AddStudent({ editMode = false }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(editMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editMode) return;

    const controller = new AbortController();

    async function loadStudent() {
      try {
        const response = await fetch(`/api/students/${id}`, {
          credentials: "include",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load student");
        }

        const student = data.student;

        setForm({
          first_name: student.first_name || "",
          grade: String(student.grade),
          province: student.province || "",
          timezone: student.timezone || "America/Toronto",
          parent_name: student.parent_name || "",
          parent_contact: student.parent_contact || "",
          fee: student.fee == null ? "" : String(student.fee),
          currency: student.currency || "CAD",
          status: student.status || "active",
        });
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
  }, [editMode, id]);

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
      first_name: form.first_name.trim(),
      grade: Number(form.grade),
      province: form.province.trim() || null,
      timezone: form.timezone,
      parent_name: form.parent_name.trim() || null,
      parent_contact: form.parent_contact.trim() || null,
      fee: form.fee === "" ? null : Number(form.fee),
      currency: form.currency,
      status: form.status,
    };

    try {
      const url = editMode
        ? `/api/students/${id}`
        : "/api/students";

      const response = await fetch(url, {
        method: editMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save student");
      }

      navigate("/students", { replace: true });
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

  return (
    <main className="students-page">
      <Link to="/students" className="back-link">
        <ArrowLeft size={18} />
        Back to students
      </Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">STUDENT MANAGEMENT</p>
          <h1>{editMode ? "Edit Student" : "Add Student"}</h1>
          <p>
            {editMode
              ? "Update the student's information."
              : "Enter the student's information below."}
          </p>
        </div>
      </div>

      <form className="student-form" onSubmit={handleSubmit}>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="first_name">First name *</label>
            <input
              id="first_name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="grade">Grade *</label>
            <select
              id="grade"
              name="grade"
              value={form.grade}
              onChange={handleChange}
              required
            >
              <option value="">Select grade</option>
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  Grade {index + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="province">Province</label>
            <input
              id="province"
              name="province"
              value={form.province}
              onChange={handleChange}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="timezone">Timezone *</label>
            <select
              id="timezone"
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
              required
            >
              <option value="America/Toronto">Eastern (Toronto)</option>
              <option value="America/Winnipeg">Central (Winnipeg)</option>
              <option value="America/Regina">Saskatchewan (Regina)</option>
              <option value="America/Edmonton">Mountain (Edmonton)</option>
              <option value="America/Vancouver">Pacific (Vancouver)</option>
              <option value="America/Halifax">Atlantic (Halifax)</option>
              <option value="America/St_Johns">Newfoundland</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="parent_name">Parent name</label>
            <input
              id="parent_name"
              name="parent_name"
              value={form.parent_name}
              onChange={handleChange}
              maxLength={150}
            />
          </div>

          <div className="form-group">
            <label htmlFor="parent_contact">Parent contact</label>
            <input
              id="parent_contact"
              name="parent_contact"
              value={form.parent_contact}
              onChange={handleChange}
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fee">Monthly fee</label>
            <input
              id="fee"
              name="fee"
              type="number"
              min="0"
              max="99999999.99"
              step="0.01"
              value={form.fee}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              name="currency"
              value={form.currency}
              onChange={handleChange}
            >
              <option value="CAD">CAD</option>
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <Link to="/students" className="cancel-link">
            Cancel
          </Link>

          <button
            type="submit"
            className="login-button save-button"
            disabled={saving || (editMode && Boolean(error))}
          >
            <Save size={18} />
            {saving
              ? "Saving..."
              : editMode
                ? "Update Student"
                : "Save Student"}
          </button>
        </div>
      </form>
    </main>
  );
}
