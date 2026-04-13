import { useMemo } from "react";
import type { LadderRung, LadderSegment, LadderContact } from "../utils/convertToLadder";

// Layout constants
const CONTACT_W = 90;
const CONTACT_H = 40;
const LABEL_H = 16;
const ROW_H = CONTACT_H + LABEL_H + 12;
const COIL_W = 90;
const LEFT_PAD = 12;
const WIRE_Y_OFFSET = LABEL_H + CONTACT_H / 2;
const STROKE = 2;
const GAP_BETWEEN_SEGMENTS = 0;
const GAP_TO_COIL = 30;
const JUNCTION_R = 4; // Junction dot radius
const JUNCTION_GAP = 30; // Clear gap before/after junction vertical bar

/* ── Draw a single contact symbol ── */
const drawContact = (x: number, y: number, contact: LadderContact, key: string) => {
  const cx = x + CONTACT_W / 2;
  const boxW = 20;
  const boxX = cx - boxW / 2;
  const wireY = y + WIRE_Y_OFFSET;

  return (
    <g key={key}>
      <text x={cx} y={y + LABEL_H - 2} textAnchor="middle" className="fill-primary" fontSize={11} fontWeight={700}>
        {contact.name}
      </text>
      <line x1={x} y1={wireY} x2={boxX} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
      <line x1={boxX} y1={wireY - 12} x2={boxX} y2={wireY + 12} stroke="currentColor" strokeWidth={STROKE} />
      <line x1={boxX + boxW} y1={wireY - 12} x2={boxX + boxW} y2={wireY + 12} stroke="currentColor" strokeWidth={STROKE} />
      {contact.negated && (
        <line x1={boxX + 4} y1={wireY + 10} x2={boxX + boxW - 4} y2={wireY - 10} stroke="currentColor" strokeWidth={STROKE} />
      )}
      <line x1={boxX + boxW} y1={wireY} x2={x + CONTACT_W} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
    </g>
  );
};

/* ── Draw the output coil ── */
const drawCoil = (x: number, y: number, name: string, key: string) => {
  const cx = x + COIL_W / 2;
  const wireY = y + WIRE_Y_OFFSET;
  const r = 12;

  return (
    <g key={key}>
      <text x={cx} y={y + LABEL_H - 2} textAnchor="middle" className="fill-primary" fontSize={11} fontWeight={700}>
        {name}
      </text>
      <line x1={x} y1={wireY} x2={cx - r} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
      <path d={`M ${cx - r} ${wireY - r} Q ${cx - r - 5} ${wireY} ${cx - r} ${wireY + r}`} fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <path d={`M ${cx + r} ${wireY - r} Q ${cx + r + 5} ${wireY} ${cx + r} ${wireY + r}`} fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <line x1={cx + r} y1={wireY} x2={x + COIL_W} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
    </g>
  );
};

/* ── Metrics for a segment ── */
function segmentWidth(seg: LadderSegment): number {
  if (seg.type === "contact") return CONTACT_W;
  const maxContacts = Math.max(...seg.branches.map((b) => b.length));
  // Width = left junction gap + contacts + right junction gap
  return JUNCTION_GAP + maxContacts * CONTACT_W + JUNCTION_GAP;
}

function segmentRows(seg: LadderSegment): number {
  if (seg.type === "contact") return 1;
  return seg.branches.length;
}

/* ── Compute full rung layout ── */
function computeRungLayout(rung: LadderRung) {
  const segWidths = rung.segments.map(segmentWidth);
  const segRowCounts = rung.segments.map(segmentRows);
  const gaps = Math.max(0, rung.segments.length - 1) * GAP_BETWEEN_SEGMENTS;
  const totalSegW = segWidths.reduce((s, w) => s + w, 0) + gaps;
  const maxRows = Math.max(...segRowCounts, 1);
  const coilX = LEFT_PAD + totalSegW + GAP_TO_COIL;
  const totalW = coilX + COIL_W + LEFT_PAD;
  const totalH = maxRows * ROW_H;
  return { segWidths, segRowCounts, coilX, totalW, totalH, maxRows };
}

/* ── Render a single rung ── */
const RungSVG = ({ rung }: { rung: LadderRung }) => {
  const { segWidths, coilX, totalW, totalH } = useMemo(
    () => computeRungLayout(rung),
    [rung]
  );

  const mainWireY = WIRE_Y_OFFSET;
  const elements: JSX.Element[] = [];

  // ── Left rail ──
  elements.push(
    <line key="rail-l" x1={0} y1={0} x2={0} y2={totalH} stroke="currentColor" strokeWidth={STROKE + 1} />
  );
  // ── Right rail ──
  elements.push(
    <line key="rail-r" x1={totalW} y1={0} x2={totalW} y2={totalH} stroke="currentColor" strokeWidth={STROKE + 1} />
  );

  // Wire: left rail → first segment
  elements.push(
    <line key="wire-start" x1={0} y1={mainWireY} x2={LEFT_PAD} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE} />
  );

  let curX = LEFT_PAD;

  rung.segments.forEach((seg, si) => {
    const w = segWidths[si];

    if (seg.type === "contact") {
      elements.push(drawContact(curX, 0, seg.contact, `c-${si}`));
    } else {
      // ── Parallel block ──
      // Structure: [JUNCTION_GAP][contacts...][JUNCTION_GAP]
      // Left vertical bar at curX + JUNCTION_GAP, right vertical bar at curX + w - JUNCTION_GAP
      const leftBarX = curX + JUNCTION_GAP;
      const rightBarX = curX + w - JUNCTION_GAP;

      // Draw each branch
      seg.branches.forEach((branch, bi) => {
        const rowY = bi * ROW_H;
        const wireY = rowY + WIRE_Y_OFFSET;

        // Wire from left bar to first contact
        elements.push(
          <line key={`pw-l-${si}-${bi}`} x1={leftBarX} y1={wireY} x2={leftBarX} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
        );

        // Draw contacts
        branch.forEach((contact, ci) => {
          elements.push(
            drawContact(leftBarX + ci * CONTACT_W, rowY, contact, `p-${si}-${bi}-${ci}`)
          );
        });

        // Wire from last contact to right bar
        const branchEndX = leftBarX + branch.length * CONTACT_W;
        if (branchEndX < rightBarX) {
          elements.push(
            <line key={`pw-r-${si}-${bi}`} x1={branchEndX} y1={wireY} x2={rightBarX} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
          );
        }
      });

      // Vertical bars and junction connections
      if (seg.branches.length > 1) {
        const topBranchY = WIRE_Y_OFFSET;
        const botBranchY = (seg.branches.length - 1) * ROW_H + WIRE_Y_OFFSET;

        // Left vertical bar (junction) - thick for visibility
        elements.push(
          <line key={`vl-${si}`} x1={leftBarX} y1={topBranchY} x2={leftBarX} y2={botBranchY} stroke="currentColor" strokeWidth={STROKE + 1} />
        );
        // Right vertical bar (junction) - thick for visibility
        elements.push(
          <line key={`vr-${si}`} x1={rightBarX} y1={topBranchY} x2={rightBarX} y2={botBranchY} stroke="currentColor" strokeWidth={STROKE + 1} />
        );

        // Horizontal wire from segment start to left bar (on main wire)
        elements.push(
          <line key={`hw-l-${si}`} x1={curX} y1={mainWireY} x2={leftBarX} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE} />
        );
        // Horizontal wire from right bar to segment end (on main wire)
        elements.push(
          <line key={`hw-r-${si}`} x1={rightBarX} y1={mainWireY} x2={curX + w} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE} />
        );

        // Junction dots at fork and merge points
        elements.push(
          <circle key={`jl-${si}`} cx={leftBarX} cy={mainWireY} r={JUNCTION_R} fill="currentColor" />
        );
        elements.push(
          <circle key={`jr-${si}`} cx={rightBarX} cy={mainWireY} r={JUNCTION_R} fill="currentColor" />
        );
      }
    }

    curX += w;
    if (si < rung.segments.length - 1 && GAP_BETWEEN_SEGMENTS > 0) {
      elements.push(
        <line key={`gap-${si}`} x1={curX} y1={mainWireY} x2={curX + GAP_BETWEEN_SEGMENTS} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE} />
      );
      curX += GAP_BETWEEN_SEGMENTS;
    }
  });

  // Wire: last segment → coil
  elements.push(
    <line key="wire-to-coil" x1={curX} y1={mainWireY} x2={coilX} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE} />
  );

  elements.push(drawCoil(coilX, 0, rung.output, "coil"));

  // Wire: coil → right rail
  elements.push(
    <line key="wire-end" x1={coilX + COIL_W} y1={mainWireY} x2={totalW} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE} />
  );

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="w-full text-foreground"
      style={{ maxWidth: totalW, minWidth: 300 }}
      preserveAspectRatio="xMidYMid meet"
    >
      {elements}
    </svg>
  );
};

interface LadderDiagramProps {
  rungs: LadderRung[];
}

const LadderDiagram = ({ rungs }: LadderDiagramProps) => (
  <div className="bg-background border border-border rounded-lg p-4 overflow-x-auto space-y-6">
    {rungs.map((rung, i) => (
      <RungSVG key={i} rung={rung} />
    ))}
  </div>
);

export default LadderDiagram;
