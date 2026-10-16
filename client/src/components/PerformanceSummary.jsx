
import {
  ChartNoAxesCombined,
  Trophy,
  TrendingDown,
  ClipboardList,
} from "lucide-react";

export default function PerformanceSummary({
  assessments = [],
}) {
  const percentages = assessments
    .map((assessment) => Number(assessment.percentage))
    .filter(Number.isFinite);

  const total = assessments.length;

  const average =
    percentages.length > 0
      ? percentages.reduce((sum, value) => sum + value, 0) /
        percentages.length
      : null;

  const highest =
    percentages.length > 0
      ? Math.max(...percentages)
      : null;

  const lowest =
    percentages.length > 0
      ? Math.min(...percentages)
      : null;

  const cards = [
    {
      label: "Average Score",
      value:
        average === null ? "N/A" : `${average.toFixed(2)}%`,
      icon: ChartNoAxesCombined,
    },
    {
      label: "Highest Score",
      value:
        highest === null ? "N/A" : `${highest.toFixed(2)}%`,
      icon: Trophy,
    },
    {
      label: "Lowest Score",
      value:
        lowest === null ? "N/A" : `${lowest.toFixed(2)}%`,
      icon: TrendingDown,
    },
    {
      label: "Total Assessments",
      value: total,
      icon: ClipboardList,
    },
  ];

  return (
    <section className="performance-summary">
      <h2>Performance Overview</h2>

      <div className="performance-summary-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              className="performance-summary-card"
              key={card.label}
            >
              <div className="performance-summary-top">
                <span>{card.label}</span>
                <Icon size={20} />
              </div>

              <strong>{card.value}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}
