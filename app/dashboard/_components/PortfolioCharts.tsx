"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type ModalityData = {
  name: string;
  value: number;
  color: string;
  percentage: string;
};

type MonthlyData = {
  month: string;
  receitas: number;
  despesas: number;
};

type Props = {
  modalityData: ModalityData[];
  monthlyData: MonthlyData[];
  totalCurrentValue: number;
  totalProperties: number;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }
  if (value >= 1_000) {
    return `R$ ${Math.round(value / 1_000)}K`;
  }
  return `R$ ${value}`;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "white",
          border: "1px solid #2A2D33",
          borderRadius: 6,
          padding: "10px 14px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          fontSize: 13,
        }}
      >
        <p style={{ fontWeight: 700, color: "#F5F3EF", marginBottom: 6 }}>
          {label}
        </p>
        {payload.map((entry: any) => (
          <p
            key={entry.dataKey}
            style={{ color: entry.fill, margin: "2px 0" }}
          >
            {entry.dataKey === "receitas" ? "Receitas" : "Despesas"}:{" "}
            {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "white",
          border: "1px solid #2A2D33",
          borderRadius: 6,
          padding: "8px 12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          fontSize: 13,
        }}
      >
        <p style={{ fontWeight: 600, color: "#F5F3EF" }}>
          {payload[0].name}
        </p>
        <p style={{ color: payload[0].payload.color }}>
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function PortfolioCharts({
  modalityData,
  monthlyData,
  totalCurrentValue,
  totalProperties,
}: Props) {
  const hasPortfolioData = modalityData.some((d) => d.value > 0);
  const hasMonthlyData = monthlyData.some(
    (d) => d.receitas > 0 || d.despesas > 0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* ── DONUT: Distribuição do portfólio ──────────── */}
      <div className="card">
        <p className="section-title">Distribuição do portfólio</p>

        {!hasPortfolioData ? (
          <div className="flex items-center justify-center h-44 text-ink-3 text-sm">
            Cadastre imóveis para ver a distribuição
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut */}
            <div className="shrink-0" style={{ width: 180, height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modalityData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {modalityData
                      .filter((d) => d.value > 0)
                      .map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda + total */}
            <div className="flex-1 w-full">
              <div className="mb-5">
                <p className="kpi-label">Patrimônio total</p>
                <p className="text-3xl font-bold text-ink">
                  {formatCurrencyShort(totalCurrentValue)}
                </p>
                <p className="text-sm text-ink-2 mt-0.5">
                  {totalProperties}{" "}
                  {totalProperties === 1 ? "imóvel" : "imóveis"}
                </p>
              </div>

              <div className="space-y-3">
                {modalityData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 flex items-baseline justify-between">
                      <span className="text-sm text-ink">{item.name}</span>
                      <div className="text-right ml-4 shrink-0">
                        <span className="text-sm font-bold text-ink">
                          {item.percentage}
                        </span>
                        <span className="text-xs text-ink-3 ml-2">
                          {item.value > 0 ? formatCurrencyShort(item.value) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BARRAS: Histórico 6 meses ─────────────────── */}
      <div className="card">
        <p className="section-title">Histórico — últimos 6 meses</p>

        {!hasMonthlyData ? (
          <div className="flex items-center justify-center h-44 text-ink-3 text-sm">
            Nenhuma transação registrada ainda
          </div>
        ) : (
          <>
            <div style={{ height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  barSize={14}
                  barCategoryGap="35%"
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1C1E22"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v === 0 ? "0" : `${Math.round(v / 1000)}K`
                    }
                    width={38}
                  />
                  <Tooltip
                    content={<CustomBarTooltip />}
                    cursor={{ fill: "#141618" }}
                  />
                  <Bar
                    dataKey="receitas"
                    fill="#C4A96B"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="despesas"
                    fill="#FCA5A5"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex gap-5 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-forest" />
                <span className="text-xs text-ink-3">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-300" />
                <span className="text-xs text-ink-3">Despesas</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
