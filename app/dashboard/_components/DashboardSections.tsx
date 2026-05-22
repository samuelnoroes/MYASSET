"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

type MonthData = {
  month: string;
  key: string;
  receitas: number;
  despesas: number;
  aportes: number;
  saldo: number;
};

type Props = {
  monthlyData: MonthData[];
  currentMonthName: string;
};

type ChartType = "bar" | "line" | "area";

const CHART_TYPES: { value: ChartType; label: string; icon: string }[] = [
  { value: "bar",  label: "Barras", icon: "▊" },
  { value: "line", label: "Linha",  icon: "╱" },
  { value: "area", label: "Área",   icon: "◭" },
];

function fmt(v: number) {
  if (Math.abs(v) >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${v.toFixed(0)}`;
}

function fmtFull(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function Delta({ current, prev, invert = false }: { current: number; prev: number; invert?: boolean }) {
  if (prev === 0) return <span className="text-ink-3 text-xs">—</span>;
  const pct = ((current - prev) / Math.abs(prev)) * 100;
  const positive = invert ? pct < 0 : pct > 0;
  const color = positive ? "#16A34A" : "#DC2626";
  const arrow = pct > 0 ? "↑" : "↓";
  return (
    <span style={{ color, fontSize: 12, fontWeight: 700 }}>
      {arrow} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1F2937", borderRadius: 8, padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)", minWidth: 180,
    }}>
      <p style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
          <span style={{ color: p.color, fontSize: 12 }}>{p.name}</span>
          <span style={{ color: "#F9FAFB", fontSize: 12, fontWeight: 700 }}>{fmtFull(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardSections({ monthlyData, currentMonthName }: Props) {
  const [chartType, setChartType] = useState<ChartType>("bar");

  useEffect(() => {
    const saved = localStorage.getItem("dashboard-chart-type") as ChartType | null;
    if (saved) setChartType(saved);
  }, []);

  function setChart(type: ChartType) {
    setChartType(type);
    localStorage.setItem("dashboard-chart-type", type);
  }

  const current = monthlyData[monthlyData.length - 1];
  const prev    = monthlyData[monthlyData.length - 2];

  // Saldo acumulado — caixa real (receitas - despesas operacionais - aportes)
  let accumulated = 0;
  const saldoAcumulado = monthlyData.map(m => {
    const saldoCaixa = m.saldo - m.aportes; // saldo operacional menos aportes de capital
    accumulated += saldoCaixa;
    return { month: m.month, "Saldo acumulado": accumulated, "Saldo mensal": saldoCaixa };
  });

  // Melhor e pior mês
  const maxReceita = Math.max(...monthlyData.map(m => m.receitas));
  const minSaldo   = Math.min(...monthlyData.map(m => m.saldo));

  const ChartWrapper = chartType === "bar" ? BarChart : chartType === "line" ? LineChart : AreaChart;

  return (
    <div className="space-y-5">

      {/* ═══ SEÇÃO 2 — MÊS ATUAL ════════════════════════ */}
      <section id="mes-atual" className="scroll-mt-6">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-3 mb-3 px-1">
          {currentMonthName} — Mês atual
        </p>

        {/* Mini barra visual */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-3">Composição do mês</p>
            <p className="text-xs text-ink-3">{fmtFull(current.receitas + current.aportes)} movimentado</p>
          </div>
          {(() => {
            const total = Math.max(current.receitas + current.despesas + current.aportes, 1);
            return (
              <div className="flex rounded-full overflow-hidden h-3 gap-0.5">
                <div style={{ width: `${(current.receitas / total) * 100}%`, backgroundColor: "#2D4A3E" }} title={`Receitas: ${fmtFull(current.receitas)}`} />
                <div style={{ width: `${(current.despesas / total) * 100}%`, backgroundColor: "#EF4444" }} title={`Despesas: ${fmtFull(current.despesas)}`} />
                <div style={{ width: `${(current.aportes / total) * 100}%`, backgroundColor: "#3B82F6" }} title={`Aportes: ${fmtFull(current.aportes)}`} />
              </div>
            );
          })()}
          <div className="flex gap-5 mt-3">
            {[
              { label: "Receitas", color: "#2D4A3E", value: current.receitas },
              { label: "Despesas", color: "#EF4444", value: current.despesas },
              { label: "Aportes",  color: "#3B82F6", value: current.aportes },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: item.color, flexShrink: 0 }} />
                <span className="text-xs text-ink-3">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparativo vs mês anterior */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Receitas", current: current.receitas, prev: prev?.receitas ?? 0, color: "#2D4A3E", invert: false },
            { label: "Despesas", current: current.despesas, prev: prev?.despesas ?? 0, color: "#EF4444", invert: true },
            { label: "Aportes",  current: current.aportes,  prev: prev?.aportes  ?? 0, color: "#3B82F6", invert: false },
            { label: "Saldo",    current: current.saldo,    prev: prev?.saldo    ?? 0, color: "#1F2937", invert: false },
          ].map(item => (
            <div key={item.label} className="card">
              <p className="kpi-label">{item.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: item.color }}>
                {fmtFull(item.current)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Delta current={item.current} prev={item.prev} invert={item.invert} />
                <span className="text-xs text-ink-3">vs mês ant.</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SEÇÃO 3 — HISTÓRICO ════════════════════════ */}
      <section id="historico" className="scroll-mt-6">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-3 mb-3 px-1">
          Histórico — Últimos 6 meses
        </p>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Mês", "Receitas", "Despesas", "Aportes", "Saldo", "Var. saldo"].map(h => (
                  <th key={h} className="text-right first:text-left py-3 px-3 text-xs font-bold uppercase tracking-wider text-ink-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {monthlyData.map((m, i) => {
                const prevM = monthlyData[i - 1];
                const saldoVar = prevM ? ((m.saldo - prevM.saldo) / (Math.abs(prevM.saldo) || 1)) * 100 : null;
                const isBestReceita = m.receitas === maxReceita && m.receitas > 0;
                const isWorstSaldo  = m.saldo === minSaldo && m.saldo < 0;
                const isCurrent = i === monthlyData.length - 1;
                return (
                  <tr key={m.key} className={`transition-colors ${isCurrent ? "bg-forest/5" : "hover:bg-surface"}`}>
                    <td className="py-3 px-3 font-semibold text-ink whitespace-nowrap">
                      {m.month}
                      {isCurrent && <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-forest bg-forest/10 px-1.5 py-0.5 rounded">atual</span>}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-medium ${isBestReceita ? "text-green-600 font-bold" : "text-positive"}`}>
                        {m.receitas > 0 ? fmtFull(m.receitas) : "—"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-ink-2">
                      {m.despesas > 0 ? fmtFull(m.despesas) : "—"}
                    </td>
                    <td className="py-3 px-3 text-right" style={{ color: m.aportes > 0 ? "#3B82F6" : "#9CA3AF" }}>
                      {m.aportes > 0 ? fmtFull(m.aportes) : "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      <span className={isWorstSaldo ? "text-red-600" : m.saldo >= 0 ? "text-positive" : "text-negative"}>
                        {fmtFull(m.saldo)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {saldoVar !== null ? (
                        <span style={{ color: saldoVar >= 0 ? "#16A34A" : "#DC2626", fontSize: 12, fontWeight: 700 }}>
                          {saldoVar >= 0 ? "↑" : "↓"} {Math.abs(saldoVar).toFixed(1)}%
                        </span>
                      ) : <span className="text-ink-3 text-xs">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-surface">
                <td className="py-3 px-3 font-bold text-ink text-xs uppercase tracking-wider">Total</td>
                <td className="py-3 px-3 text-right font-bold text-positive">{fmtFull(monthlyData.reduce((a, m) => a + m.receitas, 0))}</td>
                <td className="py-3 px-3 text-right font-bold text-ink">{fmtFull(monthlyData.reduce((a, m) => a + m.despesas, 0))}</td>
                <td className="py-3 px-3 text-right font-bold" style={{ color: "#3B82F6" }}>{fmtFull(monthlyData.reduce((a, m) => a + m.aportes, 0))}</td>
                {(() => {
                  const totalCaixa = monthlyData.reduce((a, m) => a + m.saldo - m.aportes, 0);
                  return (
                    <td className="py-3 px-3 text-right font-bold" style={{ color: totalCaixa >= 0 ? "#16A34A" : "#DC2626" }}>
                      {fmtFull(totalCaixa)}
                      <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500, marginTop: 2 }}>c/ aportes</p>
                    </td>
                  );
                })()}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* ═══ SEÇÃO 4 — GRÁFICOS ═════════════════════════ */}
      <section id="graficos" className="scroll-mt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-3">
            Gráficos
          </p>
          {/* Seletor de tipo */}
          <div className="flex gap-1 bg-white border border-border rounded-lg p-1">
            {CHART_TYPES.map(ct => (
              <button
                key={ct.value}
                onClick={() => setChart(ct.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${
                  chartType === ct.value
                    ? "bg-forest text-white shadow-sm"
                    : "text-ink-3 hover:text-ink"
                }`}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gráfico 1 — Receitas vs Despesas */}
          <div className="card">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-4">
              Receitas vs Despesas
            </p>
            <ResponsiveContainer width="100%" height={220}>
              {chartType === "bar" ? (
                <BarChart data={monthlyData} barGap={2} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="receitas" name="Receitas" fill="#2D4A3E" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#FCA5A5" radius={[3, 3, 0, 0]} />
                </BarChart>
              ) : chartType === "line" ? (
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="receitas" name="Receitas" stroke="#2D4A3E" strokeWidth={2.5} dot={{ r: 4, fill: "#2D4A3E" }} />
                  <Line dataKey="despesas" name="Despesas" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: "#EF4444" }} />
                </LineChart>
              ) : (
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2D4A3E" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2D4A3E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDesp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area dataKey="receitas" name="Receitas" stroke="#2D4A3E" fill="url(#gRec)" strokeWidth={2} />
                  <Area dataKey="despesas" name="Despesas" stroke="#EF4444" fill="url(#gDesp)" strokeWidth={2} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Gráfico 2 — Saldo acumulado */}
          <div className="card">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-4">
              Evolução do saldo
            </p>
            <ResponsiveContainer width="100%" height={220}>
              {chartType === "bar" ? (
                <BarChart data={saldoAcumulado} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Saldo mensal" fill="#6BA68A" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Saldo acumulado" fill="#1B3564" radius={[3, 3, 0, 0]} />
                </BarChart>
              ) : chartType === "line" ? (
                <LineChart data={saldoAcumulado}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="Saldo mensal" stroke="#6BA68A" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 2" />
                  <Line dataKey="Saldo acumulado" stroke="#1B3564" strokeWidth={2.5} dot={{ r: 4, fill: "#1B3564" }} />
                </LineChart>
              ) : (
                <AreaChart data={saldoAcumulado}>
                  <defs>
                    <linearGradient id="gAcum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1B3564" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1B3564" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6BA68A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6BA68A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area dataKey="Saldo mensal" stroke="#6BA68A" fill="url(#gMens)" strokeWidth={2} />
                  <Area dataKey="Saldo acumulado" stroke="#1B3564" fill="url(#gAcum)" strokeWidth={2.5} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </section>

    </div>
  );
}
