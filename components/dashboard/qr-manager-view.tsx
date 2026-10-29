"use client";

import { Button } from "@/components/ui/button";
import { DashboardToast } from "@/components/dashboard/dashboard-toast";
import { StoredQrImage } from "@/components/dashboard/qr-code-visual";
import { useCurrentUser } from "@/hooks/queries/use-current-user";
import { useSpots } from "@/hooks/queries/use-spots";
import { ApiClientError } from "@/lib/api/api-error";
import { LOW_RATING_ALERT_COUNT } from "@/lib/mocks/dashboard";
import type { SpotListItem } from "@/types/spot";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

const PER_PAGE = 8;

type SpotStatus = "active" | "inactive";

function spotStatus(spot: SpotListItem): SpotStatus {
  return spot.qrImageUrl ? "active" : "inactive";
}

function statusLabel(status: SpotStatus): string {
  return status === "active" ? "Active" : "Missing QR";
}

async function downloadQrPng(url: string, filename: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("download failed");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export function QrManagerView() {
  const { data: currentUser } = useCurrentUser();
  const hasMembership = Boolean(currentUser?.membership);
  const isAdmin = currentUser?.membership?.role === "ADMIN";

  const {
    data: spotsPayload,
    isLoading,
    isError,
    error,
  } = useSpots({ enabled: hasMembership });

  const spots = useMemo(
    () => spotsPayload?.spots ?? [],
    [spotsPayload],
  );
  const org = spotsPayload?.organization;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spots.filter((s) => {
      if (q && !s.displayName.toLowerCase().includes(q)) return false;
      const status = spotStatus(s);
      if (statusFilter === "active" && status !== "active") return false;
      if (statusFilter === "inactive" && status !== "inactive") return false;
      return true;
    });
  }, [spots, search, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE,
  );

  const effectiveSelectedId =
    selectedId && spots.some((s) => s.id === selectedId)
      ? selectedId
      : (spots[0]?.id ?? null);

  const selected =
    spots.find((s) => s.id === effectiveSelectedId) ?? null;

  const heroSpot = selected ?? spots[0] ?? null;

  const stats = useMemo(
    () => ({
      total: spots.length,
      active: spots.filter((s) => spotStatus(s) === "active").length,
      attention: spots.filter((s) => spotStatus(s) !== "active").length,
    }),
    [spots],
  );

  function openCreateModal() {
    if (!isAdmin) {
      showToast("Managers cannot create or change spots.");
      return;
    }
    showToast("Adding spots after onboarding is not available yet.");
    setModalOpen(false);
  }

  async function downloadSelectedQr() {
    if (!selected?.qrImageUrl) {
      showToast("QR image is not available for this spot.");
      return;
    }
    try {
      await downloadQrPng(
        selected.qrImageUrl,
        `scanreview-${selected.displayName.replace(/\s+/g, "-")}.png`,
      );
      showToast("QR downloaded.");
    } catch {
      showToast("Download failed. Try opening the image in a new tab.");
    }
  }

  async function printSelectedQr() {
    if (!selected?.qrImageUrl) {
      showToast("QR image is not available for this spot.");
      return;
    }
    const w = window.open("", "_blank", "width=520,height=620");
    if (!w) {
      showToast("Allow pop-ups to print this QR.");
      return;
    }
    w.document.write(
      `<html><head><title>${selected.displayName} · ScanReview</title><style>body{font:16px system-ui;text-align:center;padding:32px;color:#12142b}img{width:260px;height:260px}h1{font-size:22px}p{color:#5a5f7a;font-size:14px}</style></head><body><h1>${selected.displayName}</h1><p>Scan and rate us</p><img src="${selected.qrImageUrl}" alt="QR code"/><p>${selected.publicFeedbackUrl}</p></body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
  }

  function exportCsv() {
    const rows = [
      ["Location", "Feedback URL", "QR image URL", "Status"],
      ...spots.map((c) => [
        c.displayName,
        c.publicFeedbackUrl,
        c.qrImageUrl ?? "",
        statusLabel(spotStatus(c)),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scanreview-qr-codes.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported spot list.");
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

  const spotLabel = org?.spotLabel ?? "Spot";
  const orgName = org?.name ?? "Your business";

  if (!hasMembership) {
    return (
      <div className="qr-manager">
        <p className="hint" role="status">
          Complete{" "}
          <Link href="/dashboard/onboarding">business onboarding</Link> to
          manage QR codes.
        </p>
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : "Unable to load spots.";
    return (
      <div className="qr-manager">
        <p className="err" role="alert">
          {message}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="qr-manager">
        <section className="page-heading">
          <div>
            <div className="eyebrow">
              <i aria-hidden="true" /> {spotLabel.toUpperCase()}-SIDE FEEDBACK
              SETUP
            </div>
            <h1>Your QR codes, all in one place.</h1>
            <p className="subtitle">
              Create a code for every {spotLabel.toLowerCase()}, keep labels
              organized, and see which touchpoints are ready to print.
            </p>
          </div>
          <div className="heading-actions">
            <Button type="button" variant="ghost" onClick={exportCsv}>
              Export list
            </Button>
            <Button type="button" onClick={openCreateModal} disabled={!isAdmin}>
              Create QR code
            </Button>
          </div>
        </section>

        <section className="qr-stats" aria-label="QR code summary">
          {isLoading ? (
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
                <div className="qr-stat-note">Demo until feedback API</div>
              </article>
              <article className="qr-stat">
                <div className="qr-stat-top">
                  <span className="stat-label">Need attention</span>
                </div>
                <div className="qr-stat-value">{stats.attention}</div>
                <div className="qr-stat-note">Missing stored QR image</div>
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
              Put a unique QR code on each {spotLabel.toLowerCase()}. Guests
              share feedback in seconds; your team responds before they leave.
            </p>
            <div className="qr-hero-actions">
              <Button
                type="button"
                className="qr-white-btn"
                onClick={openCreateModal}
                disabled={!isAdmin}
              >
                Create a {spotLabel.toLowerCase()} code ↗
              </Button>
            </div>
          </div>
          {heroSpot ? (
            <div className="qr-hero-art" aria-label="Sample QR preview">
              <div className="qr-art-label">
                {orgName.toUpperCase()}{" "}
                <span>{heroSpot.displayName.toUpperCase()}</span>
              </div>
              <div className="qr-art-paper">
                <StoredQrImage
                  src={heroSpot.qrImageUrl}
                  alt={`QR code for ${heroSpot.displayName}`}
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
                  Manage labels and keep each printed code connected to the
                  right spot.
                </p>
              </div>
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
                  placeholder={`Search ${spotLabel.toLowerCase()}s…`}
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
                <option value="inactive">Missing QR</option>
              </select>
            </div>
            <div
              className={cn(
                "qr-table-wrap",
                filtered.length === 0 && !isLoading && "has-empty",
              )}
            >
              {isLoading ? (
                <p className="hint dash-table-loading">Loading spots…</p>
              ) : filtered.length === 0 ? (
                <div className="qr-empty" role="status">
                  <strong>No matching QR codes</strong>
                  <p className="hint">
                    {spots.length === 0
                      ? "No spots yet. Finish onboarding to create your first codes."
                      : "Try another search or clear your filters."}
                  </p>
                  {spots.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("all");
                        setPage(1);
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : null}
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
                      <th>Number</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((spot) => {
                      const status = spotStatus(spot);
                      return (
                        <tr
                          key={spot.id}
                          className={cn(
                            spot.id === effectiveSelectedId && "selected",
                          )}
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
                              aria-label={`Select ${spot.displayName}`}
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
                              <strong>{spot.displayName}</strong>
                              <small>{spot.publicFeedbackPath}</small>
                            </button>
                          </td>
                          <td>
                            <strong className="scan-number">{spot.number}</strong>
                          </td>
                          <td>
                            <span className={cn("status-badge", status)}>
                              {statusLabel(status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
                    <h2>{selected.displayName}</h2>
                    <p>Spot {selected.number}</p>
                  </div>
                </div>
                <div className="qr-detail-paper">
                  <StoredQrImage
                    src={selected.qrImageUrl}
                    alt={`QR code for ${selected.displayName}`}
                    size={144}
                  />
                  <p className="q-cta">Scan and Rate us</p>
                  <p className="q-spot">{selected.displayName}</p>
                  <span className="qr-url">{selected.publicFeedbackUrl}</span>
                </div>
                <div className="qr-detail-actions">
                  <Button
                    type="button"
                    onClick={() => void downloadSelectedQr()}
                    disabled={!selected.qrImageUrl}
                  >
                    Download QR
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void printSelectedQr()}
                    disabled={!selected.qrImageUrl}
                  >
                    Print
                  </Button>
                </div>
              </>
            ) : (
              <p className="hint">Select a spot to preview its QR.</p>
            )}
          </aside>
        </section>

        <p className="qr-disclaimer">
          QR images are loaded from your saved Supabase Storage bucket. Guest
          feedback counts remain demo until the feedback API is connected.
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
                <p>Not available in this release.</p>
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
          </div>
        </div>
      ) : null}

      <DashboardToast message={toast} />
    </>
  );
}
