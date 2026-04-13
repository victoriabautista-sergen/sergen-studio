import { useMemo } from "react";
import type { LadderRung, LadderSegment, LadderContact } from "../utils/convertToLadder";

// Layout constants
const CONTACT_W = 80;
const CONTACT_H = 40;
const LABEL_H = 16;
const ROW_H = CONTACT_H + LABEL_H + 8;
const COIL_W = 80;
const RAIL_X = 0;
const LEFT_PAD = 10;
const WIRE_Y_OFFSET = LABEL_H + CONTACT_H / 2;
const STROKE = 2;
const GAP_TO_COIL = 40;
const JUNCTION_R = 3;

const drawContact = (x: number, y: number, contact: LadderContact, key: string) => {
  const cx = x + CONTACT_W / 2;
  const boxW = 20;
  const boxX = cx - boxW / 2;
  const wireY = y + WIRE_Y_OFFSET;

  return (
    <g key={key}>
      <text x={cx} y={y + LABEL_H - 2} textAnchor="middle" className="fill-primary" fontSize={12} fontWeight={700}>
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

const drawCoil = (x: number, y: number, name: string, key: string) => {
  const cx = x + COIL_W / 2;
  const wireY = y + WIRE_Y_OFFSET;
  const r = 12;

  return (
    <g key={key}>
      <text x={cx} y={y + LABEL_H - 2} textAnchor="middle" className="fill-primary" fontSize={12} fontWeight={700}>
        {name}
      </text>
      <line x1={x} y1={wireY} x2={cx - r} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
      <path d={`M ${cx - r} ${wireY - r} Q ${cx - r - 5} ${wireY} ${cx - r} ${wireY + r}`} fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <path d={`M ${cx + r} ${wireY - r} Q ${cx + r + 5} ${wireY} ${cx + r} ${wireY + r}`} fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <line x1={cx + r} y1={wireY} x2={x + COIL_W} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
    </g>
  );
};

/** Compute width and height of a segment */
function segmentMetrics(seg: LadderSegment): { w: number; rows: number } {
  if (seg.type === 'contact') {
    return { w: CONTACT_W, rows: 1 };
  }
  const maxContacts = Math.max(...seg.branches.map(b => b.length));
  return { w: maxContacts * CONTACT_W, rows: seg.branches.length };
}

function computeRungLayout(rung: LadderRung) {
  const segMeta = rung.segments.map(segmentMetrics);
  const totalSegW = segMeta.reduce((sum, m) => sum + m.w, 0);
  const maxRows = Math.max(...segMeta.map(m => m.rows), 1);
  const coilX = LEFT_PAD + totalSegW + GAP_TO_COIL;
  const totalW = coilX + COIL_W + LEFT_PAD;
  const totalH = maxRows * ROW_H;
  return { segMeta, coilX, totalW, totalH, maxRows };
}

const RungSVG = ({ rung }: { rung: LadderRung }) => {
  const { segMeta, coilX, totalW, totalH } = useMemo(
    () => computeRungLayout(rung),
    [rung]
  );

  const railRight = totalW;
  const mainWireY = WIRE_Y_OFFSET;

  const elements: JSX.Element[] = [];

  // Left rail — only extend to main wire height
  elements.push(<line key="lr" x1={RAIL_X} y1={0} x2={RAIL_X} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE + 1} />);
  // Right rail — only extend to main wire height
  elements.push(<line key="rr" x1={railRight} y1={0} x2={railRight} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE + 1} />);

  // Wire from left rail to first segment
  elements.push(<line key="lw" x1={RAIL_X} y1={mainWireY} x2={LEFT_PAD} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE} />);

  let curX = LEFT_PAD;

  rung.segments.forEach((seg, si) => {
    const meta = segMeta[si];

    if (seg.type === 'contact') {
      elements.push(drawContact(curX, 0, seg.contact, `seg-${si}`));
    } else {
      // Parallel segment
      const branchStartX = curX;
      const branchEndX = curX + meta.w;

      seg.branches.forEach((branch, bi) => {
        const rowY = bi * ROW_H;
        const wireY = rowY + WIRE_Y_OFFSET;

        // Draw contacts in this branch
        branch.forEach((c, ci) => {
          elements.push(drawContact(branchStartX + ci * CONTACT_W, rowY, c, `pc-${si}-${bi}-${ci}`));
        });

        // Wire from last contact to branch end (fill remaining width)
        const lastEnd = branchStartX + branch.length * CONTACT_W;
        if (lastEnd < branchEndX) {
          elements.push(
            <line key={`pw-r-${si}-${bi}`} x1={lastEnd} y1={wireY} x2={branchEndX} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
          );
        }
      });

      // Vertical connectors for parallel branches
      if (seg.branches.length > 1) {
        const topY = WIRE_Y_OFFSET;
        const botY = (seg.branches.length - 1) * ROW_H + WIRE_Y_OFFSET;
        // Left vertical
        elements.push(
          <line key={`pv-l-${si}`} x1={branchStartX} y1={topY} x2={branchStartX} y2={botY} stroke="currentColor" strokeWidth={STROKE} />
        );
        // Right vertical
        elements.push(
          <line key={`pv-r-${si}`} x1={branchEndX} y1={topY} x2={branchEndX} y2={botY} stroke="currentColor" strokeWidth={STROKE} />
        );
        // Junction dots at branching points
        elements.push(
          <circle key={`jd-l-${si}`} cx={branchStartX} cy={topY} r={JUNCTION_R} fill="currentColor" />
        );
        elements.push(
          <circle key={`jd-r-${si}`} cx={branchEndX} cy={topY} r={JUNCTION_R} fill="currentColor" />
        );
      }
    }

    curX += meta.w;
  });

  // Wire from last segment to coil
  elements.push(
    <line key="jw" x1={curX} y1={mainWireY} x2={coilX} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE} />
  );

  // Coil
  elements.push(drawCoil(coilX, 0, rung.output, "coil"));

  // Wire from coil to right rail
  elements.push(
    <line key="rrw" x1={coilX + COIL_W} y1={mainWireY} x2={railRight} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE} />
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
  <div className="bg-background border border-border rounded-lg p-4 overflow-x-auto space-y-4">
    {rungs.map((rung, i) => (
      <RungSVG key={i} rung={rung} />
    ))}
  </div>
);

export default LadderDiagram;
