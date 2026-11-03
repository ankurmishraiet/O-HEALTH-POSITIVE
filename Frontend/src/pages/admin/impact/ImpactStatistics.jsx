import "./ImpactStatistics.css";
import { useEffect, useState } from "react";
import {
  getImpactStats,
  createImpactStats,
  updateImpactStats,
} from "../../../services/impactApi";

const initialValues = {
  fundsRaised: "0",
  successfulCampaigns: "0",
  monthlyDonors: "0",
  livesImpacted: "0",
};

const fields = [
  {
    name: "fundsRaised",
    label: "Funds Raised",
    description: "Amount raised in crores",
    step: "any",
  },
  {
    name: "successfulCampaigns",
    label: "Successful Campaigns",
    description: "Total completed campaigns",
    step: "1",
  },
  {
    name: "monthlyDonors",
    label: "Monthly Donors",
    description: "Number of monthly donors",
    step: "1",
  },
  {
    name: "livesImpacted",
    label: "Lives Impacted",
    description: "Number of people impacted",
    step: "1",
  },
];

function ImpactStatistics() {
  const [values, setValues] = useState(initialValues);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadStats = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getImpactStats();

      if (!result?.success || !result?.data) {
        throw new Error("Unable to load impact statistics.");
      }

      const data = result.data;

      setValues({
        fundsRaised: String(data.fundsRaised ?? 0),
        successfulCampaigns: String(data.successfulCampaigns ?? 0),
        monthlyDonors: String(data.monthlyDonors ?? 0),
        livesImpacted: String(data.livesImpacted ?? 0),
      });

      setExists(Boolean(result.exists));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load impact statistics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const payload = {};

    for (const field of fields) {
      const value = values[field.name];

      if (
        value.trim() === "" ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0
      ) {
        setError(`${field.label} must be a valid non-negative number.`);
        return;
      }

      if (
        field.step === "1" &&
        !Number.isInteger(Number(value))
      ) {
        setError(`${field.label} must be a whole number.`);
        return;
      }

      payload[field.name] = Number(value);
    }

    setSaving(true);

    try {
      let result;

      try {
        result = await updateImpactStats(payload);
      } catch (err) {
        if (err.response?.status === 404) {
          result = await createImpactStats(payload);
        } else {
          throw err;
        }
      }

      if (!result?.success) {
        throw new Error(result?.message || "Unable to save statistics.");
      }

      setExists(true);

      if (result.data) {
        setValues({
          fundsRaised: String(result.data.fundsRaised ?? 0),
          successfulCampaigns: String(
            result.data.successfulCampaigns ?? 0
          ),
          monthlyDonors: String(result.data.monthlyDonors ?? 0),
          livesImpacted: String(result.data.livesImpacted ?? 0),
        });
      }

      setMessage(result.message || "Impact statistics saved successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save impact statistics."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="impact-admin">
      <header className="impact-admin-header">
        <div>
          <span className="impact-admin-eyebrow">
            WEBSITE CONTENT
          </span>
          <h1>Impact Statistics</h1>
          <p>
            Manage the statistics displayed in the public Impact
            section of your website.
          </p>
        </div>

        <button
          type="button"
          className="impact-admin-refresh"
          onClick={loadStats}
          disabled={loading || saving}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </header>

      {loading ? (
        <div className="impact-admin-state">
          Loading impact statistics...
        </div>
      ) : (
        <form className="impact-admin-form" onSubmit={handleSubmit}>
          <div className="impact-admin-form-heading">
            <h2>Manage impact numbers</h2>
            <p>
              Enter the latest values and save your changes.
            </p>
          </div>

          <div className="impact-admin-grid">
            {fields.map((field) => (
              <label
                className="impact-admin-field"
                key={field.name}
              >
                <span>{field.label}</span>
                <input
                  type="number"
                  name={field.name}
                  min="0"
                  step={field.step}
                  value={values[field.name]}
                  onChange={handleChange}
                  required
                />
                <small>{field.description}</small>
              </label>
            ))}
          </div>

          {error && (
            <p className="impact-admin-error" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="impact-admin-success" role="status">
              {message}
            </p>
          )}

          <div className="impact-admin-actions">
            <button
              type="submit"
              className="impact-admin-save"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : exists
                ? "Update Statistics"
                : "Create Statistics"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default ImpactStatistics;