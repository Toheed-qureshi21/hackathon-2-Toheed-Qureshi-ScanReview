"use client";

import { Button } from "@/components/ui/button";
import { DashboardToast } from "@/components/dashboard/dashboard-toast";
import {
  generateDemoQrDataUrl,
  QrCodeVisual,
} from "@/components/dashboard/qr-code-visual";
import {
  LOW_RATING_ALERT_COUNT,
  mockOrganization,
  mockQrSpots,
  QR_AREAS,
  type MockQrSpot,
  type QrSpotStatus,
} from "@/lib/mocks/dashboard";
import { formatSpotName } from "@/lib/onboarding/constants";
import { cn } from "@/lib/utils";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

const PER_PAGE = 8;
const ORG = mockOrganization;

function statusLabel(status: QrSpotStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function makeId(): string {
  return `qr-${Math.random().toString(36).slice(2, 8)}`;
}

export function QrManagerView() {
  const [spots, setSpots] = useState<MockQrSpot[]>(() =>
    mockQrSpots.map((s) => ({ ...s })),
  );
  const [selectedId, setSelectedId] = useState("t07");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [bootLoading, setBootLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setBootLoading(false), 400);
    return () => window.clearTimeout(t);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spots.filter((s) => {
      const hay = `${s.name} ${s.area} ${s.detail}`.toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (areaFilter !== "all" && s.area !== areaFilter) return false;
      return true;
    });
  }, [spots, search, statusFilter, areaFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE,
  );

  const selected =
    spots.find((s) => s.id === selectedId) ?? spots[0] ?? null;

  const heroSpot =
    spots.find((s) => s.id === "t07") ?? selected ?? spots[0];

  const stats = useMemo(
    () => ({
      total: spots.length,
      active: spots.filter((s) => s.status === "active").length,
      attention: spots.filter((s) => s.status !== "active").length,
    }),
    [spots],
  );

  function openCreateModal() {
    setModalOpen(true);
  }

  function handleCreateSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const area = String(fd.get("area") ?? "");
    const detail = String(fd.get("detail") ?? "").trim();
    const status = String(fd.get("status") ?? "draft") as QrSpotStatus;
    if (!name) return;

    const spotLabel = name.split(/\s+/)[0] ?? ORG.spotLabel;
    const numMatch = name.match(/(\d+)\s*$/);
    const spotNumber = numMatch ? Number(numMatch[1]) : spots.length + 1;
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || makeId();

    const item: MockQrSpot = {
      id: makeId(),
      name,
      spotLabel,
      spotNumber,
      area,
      detail: detail || "—",
      scans30d: 0,
      feedbackCount: 0,
      lastScanLabel: "Never",
      status,
      slug,
    };
    setSpots((prev) => [item, ...prev]);
    setSelectedId(item.id);
    setPage(1);
    setModalOpen(false);
    showToast("Demo only: QR saved in this session (not persisted).");
  }

  async function downloadSelectedQr() {
    if (!selected || selected.status !== "active") {
      showToast("Activate this code before downloading (demo).");
      return;
    }
    try {
      const url = await generateDemoQrDataUrl(ORG, selected, 260);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scanreview-demo-${selected.id}.png`;
      a.click();
      showToast("Demo QR downloaded as PNG (not a production token).");
    } catch {
      showToast("Demo QR download failed.");
    }
  }

  async function printSelectedQr() {
    if (!selected || selected.status !== "active") {
      showToast("Activate this code before printing (demo).");
      return;
    }
    try {
      const url = await generateDemoQrDataUrl(ORG, selected, 260);
      const w = window.open("", "_blank", "width=520,height=620");
      if (!w) {
        showToast("Allow pop-ups to print this demo QR.");
        return;
      }
      w.document.write(
        `<html><head><title>${selected.name} · ScanReview demo</title><style>body{font:16px system-ui;text-align:center;padding:32px;color:#12142b}img{width:260px;height:260px}h1{font-size:22px}p{color:#5a5f7a;font-size:14px}</style></head><body><h1>${selected.name}</h1><p>Scan and Rate us · Demo QR</p><img src="${url}" alt="Demo QR"/><p>UI preview — not a production feedback link.</p></body></html>`,
      );
      w.document.close();
      w.focus();
      w.print();
    } catch {
      showToast("Demo print preview failed.");
    }
  }

  function exportCsv() {
    const rows = [
      ["Location", "Area", "Details", "Status", "Scans 30d", "Feedback"],
      ...spots.map((c) => [
        c.name,
        c.area,
        c.detail,
        c.status,
        String(c.scans30d),
        String(c.feedbackCount),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scanreview-qr-codes-demo.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported demo CSV (mock data).");
  }

  function toggleRowCheck(id: string, on: boolean) {
    setChecked((prev) => ({ ...prev, [id]: on }));
  }

  function toggleSelectAll(on: boolean) {
    const next: Record<string, boolean> = {};
    visible.forEach((s) => {
      next[s.id] = on;
    });
    setChecked((prev) => ({ ...prev, ...next }));
  }

  const demoUrlLabel = selected
    ? `demo.local/feedback/demo (${selected.slug})`
    : "—";

  return (
    <>
      <div className="qr-manager">
        <section className="page-heading">
          <div>
            <div className="eyebrow">
              <i aria-hidden="true" /> {ORG.spotLabel.toUpperCase()}-SIDE FEEDBACK
              SETUP
            </div>
            <h1>Your QR codes, all in one place.</h1>
            <p className="subtitle">
              Create a code for every {ORG.spotLabel.toLowerCase()}, keep labels
              organized, and see which touchpoints are ready to print.
            </p>
          </div>
          <div className="heading-actions">
            <Button type="button" variant="ghost" onClick={exportCsv}>
              Export list
            </Button>
            <Button type="button" onClick={openCreateModal}>
              Create QR code
            </Button>
          </div>
        </section>

        <section className="qr-stats" aria-label="QR code summary">
          {bootLoading ? (
            <p className="hint qr-stats-loading">Loading summary…</p>
          ) : (
            <>
              <article className="qr-stat">
                <div className="qr-stat-top">
                  <span className="stat-label">Total QR codes</span>
                </div>
                <div className="qr-stat-value">{stats.total}</div>
                <div className="qr-stat-note">Across your workspace</div>
              </article>
              <article className="qr-stat">
                <div className="qr-stat-top">
                  <span className="stat-label">Active and ready</span>
                </div>
                <div className="qr-stat-value">{stats.active}</div>
                <div className="qr-stat-note">Ready for guests</div>
              </article>
              <article className="qr-stat">
                <div className="qr-stat-top">
                  <span className="stat-label">Low-rating alerts</span>
                </div>
                <div className="qr-stat-value">{LOW_RATING_ALERT_COUNT}</div>
                <div className="qr-stat-note">Demo feedback items ≤ 2★</div>
              </article>
              <article className="qr-stat">
                <div className="qr-stat-top">
                  <span className="stat-label">Need attention</span>
                </div>
                <div className="qr-stat-value">{stats.attention}</div>
                <div className="qr-stat-note">Inactive or draft codes</div>
              </article>
            </>
          )}
        </section>

        <section className="qr-hero">
          <div className="qr-hero-copy">
            <span className="qr-hero-kicker">
              <span aria-hidden="true" /> SIMPLE SETUP, BETTER SERVICE
            </span>
            <h2>One scan can turn a bad experience around.</h2>
            <p>
              Put a unique QR code on each {ORG.spotLabel.toLowerCase()}. Guests
              share feedback in seconds; your team responds before they leave.
            </p>
            <div className="qr-hero-actions">
              <Button type="button" className="qr-white-btn" onClick={openCreateModal}>
                Create a {ORG.spotLabel.toLowerCase()} code ↗
              </Button>
            </div>
          </div>
          {heroSpot ? (
            <div className="qr-hero-art" aria-label="Sample QR preview">
              <div className="qr-art-label">
                {ORG.name.toUpperCase()}{" "}
                <span>{heroSpot.name.toUpperCase()}</span>
              </div>
              <div className="qr-art-paper">
                <QrCodeVisual
                  key={heroSpot.id}
                  org={ORG}
                  spot={heroSpot}
                  size={112}
                />
                <div className="qr-art-caption">Scan and Rate us</div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="qr-workspace">
          <div className="qr-list-column">
            <div className="qr-list-head">
              <div>
                <h2>Your locations</h2>
                <p>
                  Manage labels and keep each printed code connected to the right
                  spot.
                </p>
              </div>
              <span className="data-chip">Demo data</span>
            </div>
            <div className="qr-toolbar">
              <label className="qr-search">
                <span className="sr-only">Search spots</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder={`Search ${ORG.spotLabel.toLowerCase()}s or areas…`}
                />
              </label>
              <select
                className="qr-filter"
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                className="qr-filter"
                aria-label="Filter by area"
                value={areaFilter}
                onChange={(e) => {
                  setAreaFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All areas</option>
                {QR_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div
              className={cn(
                "qr-table-wrap",
                filtered.length === 0 && "has-empty",
              )}
            >
              {bootLoading ? (
                <p className="hint dash-table-loading">Loading spots…</p>
              ) : filtered.length === 0 ? (
                <div className="qr-empty" role="status">
                  <strong>No matching QR codes</strong>
                  <p className="hint">
                    Try another search or clear your filters.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                      setAreaFilter("all");
                      setPage(1);
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <table className="qr-table">
                  <thead>
                    <tr>
                      <th className="qr-check-col">
                        <input
                          type="checkbox"
                          aria-label="Select all on this page"
                          checked={
                            visible.length > 0 &&
                            visible.every((s) => checked[s.id])
                          }
                          ref={(el) => {
                            if (el) {
                              el.indeterminate =
                                visible.some((s) => checked[s.id]) &&
                                !visible.every((s) => checked[s.id]);
                            }
                          }}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th>Location</th>
                      <th>Area</th>
                      <th>Scans · 30 days</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((spot) => (
                      <tr
                        key={spot.id}
                        className={cn(spot.id === selectedId && "selected")}
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest(
                              "input,button,a",
                            )
                          ) {
                            return;
                          }
                          setSelectedId(spot.id);
                        }}
                      >
                        <td className="qr-check-col">
                          <input
                            type="checkbox"
                            aria-label={`Select ${spot.name}`}
                            checked={!!checked[spot.id]}
                            onChange={(e) =>
                              toggleRowCheck(spot.id, e.target.checked)
                            }
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="location-cell"
                            onClick={() => setSelectedId(spot.id)}
                          >
                            <strong>{spot.name}</strong>
                            <small>{spot.detail}</small>
                          </button>
                        </td>
                        <td>
                          <span className="area-label">{spot.area}</span>
                        </td>
                        <td>
                          <strong className="scan-number">
                            {spot.scans30d.toLocaleString()}
                          </strong>
                          <span className="scan-caption">
                            {spot.feedbackCount} feedback
                          </span>
                        </td>
                        <td>
                          <span
                            className={cn("status-badge", spot.status)}
                          >
                            {statusLabel(spot.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {filtered.length > 0 ? (
              <div className="qr-table-footer">
                <span>
                  Showing {(safePage - 1) * PER_PAGE + 1}–
                  {Math.min(safePage * PER_PAGE, filtered.length)} of{" "}
                  {filtered.length} QR codes
                </span>
                <div className="qr-pagination">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </button>
                  <span>
                    {safePage} <i>of</i> {pages}
                  </span>
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={safePage >= pages}
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  >
                    ›
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="qr-detail-column">
            {selected ? (
              <>
                <div className="qr-detail-head">
                  <div>
                    <span className="qr-detail-eyebrow">SELECTED CODE</span>
                    <h2>{selected.name}</h2>
                    <p>
                      {selected.area} · {selected.detail}
                    </p>
                  </div>
                </div>
                <div className="qr-detail-paper">
                  <QrCodeVisual
                    key={selected.id}
                    org={ORG}
                    spot={selected}
                    size={144}
                  />
                  <p className="q-cta">Scan and Rate us</p>
                  <p className="q-spot">
                    {formatSpotName(selected.spotLabel, selected.spotNumber)}
                  </p>
                  <span className="qr-url">{demoUrlLabel}</span>
                  <p className="hint qr-demo-note">
                    Demo URL shape — not a production token.
                  </p>
                </div>
                <div className="qr-detail-actions">
                  <Button
                    type="button"
                    onClick={downloadSelectedQr}
                    disabled={selected.status !== "active"}
                  >
                    Download QR
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={printSelectedQr}
                    disabled={selected.status !== "active"}
                  >
                    Print
                  </Button>
                </div>
                <div className="qr-detail-divider" />
                <div className="qr-detail-metrics">
                  <div>
                    <span>Scans this month</span>
                    <strong>{selected.scans30d.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Feedback received</span>
                    <strong>{selected.feedbackCount.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Last scan</span>
                    <strong>{selected.lastScanLabel}</strong>
                  </div>
                </div>
              </>
            ) : (
              <p className="hint">Select a spot to preview its demo QR.</p>
            )}
          </aside>
        </section>

        <p className="qr-disclaimer">
          Dashboard preview · Sample data. QR codes and feedback shown here are
          illustrative until connected to your ScanReview backend.
        </p>
      </div>

      {modalOpen ? (
        <div
          className="qr-modal open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          <div className="qr-modal-card">
            <div className="qr-modal-head">
              <div>
                <h2 id="qr-modal-title">Create a QR code</h2>
                <p>Demo only — adds a row in this session.</p>
              </div>
              <button
                type="button"
                className="qr-modal-close"
                aria-label="Close dialog"
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form className="qr-form" onSubmit={handleCreateSubmit}>
              <label>
                Location name
                <input
                  name="name"
                  required
                  maxLength={50}
                  placeholder={`e.g. ${ORG.spotLabel} 12`}
                />
              </label>
              <label>
                Area
                <select name="area" required defaultValue={QR_AREAS[0]}>
                  {QR_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Location details
                <input
                  name="detail"
                  maxLength={80}
                  placeholder="e.g. Window side"
                />
              </label>
              <label>
                Code status
                <select name="status" defaultValue="draft">
                  <option value="active">Active — ready for guests</option>
                  <option value="draft">Draft — not ready to print</option>
                  <option value="inactive">Inactive — disabled</option>
                </select>
              </label>
              <div className="qr-form-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create QR code</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <DashboardToast message={toast} />
    </>
  );
}
