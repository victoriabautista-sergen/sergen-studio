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
const PARALLEL_BRANCH_PADDING = 24;

/* ── Draw a single contact symbol ── */
const drawContact = (x: number, y: number, contact: LadderContact, key: string) => {
  const cx = x + CONTACT_W / 2;
  const boxW = 20;
  const boxX = cx - boxW / 2;
  const wireY = y + WIRE_Y_OFFSET;

  return (
    <g key={key}>
      {/* Label */}
      <text x={cx} y={y + LABEL_H - 2} textAnchor="middle" className="fill-primary" fontSize={11} fontWeight={700}>
        {contact.name}
      </text>
      {/* Left wire into contact */}
      <line x1={x} y1={wireY} x2={boxX} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
      {/* Contact bars */}
      <line x1={boxX} y1={wireY - 12} x2={boxX} y2={wireY + 12} stroke="currentColor" strokeWidth={STROKE} />
      <line x1={boxX + boxW} y1={wireY - 12} x2={boxX + boxW} y2={wireY + 12} stroke="currentColor" strokeWidth={STROKE} />
      {/* Negation diagonal */}
      {contact.negated && (
        <line x1={boxX + 4} y1={wireY + 10} x2={boxX + boxW - 4} y2={wireY - 10} stroke="currentColor" strokeWidth={STROKE} />
      )}
      {/* Right wire out of contact */}
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
  return maxContacts * CONTACT_W + PARALLEL_BRANCH_PADDING * 2;
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

  const mainWireY = WIRE_Y_OFFSET; // Y of main horizontal wire (row 0)
  const elements: JSX.Element[] = [];

  // ── Left rail (full height) ──
  elements.push(
    <line key="rail-l" x1={0} y1={0} x2={0} y2={totalH} stroke="currentColor" strokeWidth={STROKE + 1} />
  );
  // ── Right rail (full height) ──
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
      // ── Series contact: draw on main wire ──
      elements.push(drawContact(curX, 0, seg.contact, `c-${si}`));
    } else {
      // ── Parallel block ──
      const blockStartX = curX;
      const blockEndX = curX + w;
      const branchStartX = blockStartX + PARALLEL_BRANCH_PADDING;

      seg.branches.forEach((branch, bi) => {
        const rowY = bi * ROW_H;
        const wireY = rowY + WIRE_Y_OFFSET;
        const branchEndX = branchStartX + branch.length * CONTACT_W;

        elements.push(
          <line
            key={`pw-start-${si}-${bi}`}
            x1={blockStartX}
            y1={wireY}
            x2={branchStartX}
            y2={wireY}
            stroke="currentColor"
            strokeWidth={STROKE}
          />
        );

        branch.forEach((contact, ci) => {
          elements.push(
            drawContact(branchStartX + ci * CONTACT_W, rowY, contact, `p-${si}-${bi}-${ci}`)
          );
        });

        if (branchEndX < blockEndX) {
          elements.push(
            <line
              key={`pw-end-${si}-${bi}`}
              x1={branchEndX}
              y1={wireY}
              x2={blockEndX}
              y2={wireY}
              stroke="currentColor"
              strokeWidth={STROKE}
            />
          );
        }
      });

      if (seg.branches.length > 1) {
        const topY = mainWireY;
        const botY = (seg.branches.length - 1) * ROW_H + WIRE_Y_OFFSET;

        elements.push(
          <line key={`vl-${si}`} x1={blockStartX} y1={topY} x2={blockStartX} y2={botY} stroke="currentColor" strokeWidth={STROKE} />
        );
        elements.push(
          <line key={`vr-${si}`} x1={blockEndX} y1={topY} x2={blockEndX} y2={botY} stroke="currentColor" strokeWidth={STROKE} />
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

  // Coil on main wire
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
