
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function ProgressChart({ assessments = [] }) {
  // Sort assessment records from oldest to newest
  const chartData = [...assessments]
    .sort((a, b) => {
      const dateA = String(a.assessment_date).slice(0, 10);
      const dateB = String(b.assessment_date).slice(0, 10);

      const dateComparison = dateA.localeCompare(dateB);

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return Number(a.id) - Number(b.id);
    })
    .map((assessment, index) => ({
      id: assessment.id,
      number: index + 1,
      date: String(assessment.assessment_date).slice(0, 10),
      topic: assessment.topic,
      subject: assessment.subject,
      type: assessment.assessment_type,
      percentage: Number(assessment.percentage),
    }));

  if (chartData.length === 0) {
    return (
      <div className="progress-chart-card">
        <h2>Student Performance Trend</h2>
        <p>No assessment data available yet.</p>
      </div>
    );
  }

  return (
    <div className="progress-chart-card">
      <h2>Student Performance Trend</h2>

      <p className="progress-chart-description">
        Assessment scores over time
      </p>

      <div className="progress-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 25,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="number"
              tick={{ fontSize: 12 }}
              allowDecimals={false}
              label={{
                value: "Assessment Number",
                position: "insideBottom",
                offset: -5,
              }}
            />

            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 12 }}
            />

            <Tooltip
              formatter={(value) => [
                `${Number(value).toFixed(2)}%`,
                "Score",
              ]}
              labelFormatter={(_, payload) => {
                const item = payload?.[0]?.payload;

                return item
                  ? `${item.date} — ${item.subject}: ${item.topic}`
                  : "Assessment";
              }}
            />

            <Line
              type="linear"
              dataKey="percentage"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
