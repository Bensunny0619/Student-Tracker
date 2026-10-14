
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function AddStudent() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add student");
      }

      navigate("/students", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
          <h1>Add Student</h1>
          <p>Enter the student's information below.</p>
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
              placeholder="e.g. Ontario"
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
              placeholder="Email or phone number"
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
              placeholder="e.g. 50000"
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
            disabled={saving}
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Student"}
          </button>
        </div>
      </form>
    </main>
  );
}
