import { useMemo } from "react";
import type { LadderRung, LadderContact, LadderBranch } from "../utils/convertToLadder";

// Layout constants
const CONTACT_W = 80;
const CONTACT_H = 40;
const LABEL_H = 16;
const ROW_H = CONTACT_H + LABEL_H + 8; // total height per branch row
const COIL_W = 80;
const RAIL_X = 0;
const LEFT_PAD = 10;
const WIRE_Y_OFFSET = LABEL_H + CONTACT_H / 2; // vertical center of the contact box
const STROKE = 2;

const drawContact = (
  x: number,
  y: number,
  contact: LadderContact,
  key: string
) => {
  const cx = x + CONTACT_W / 2;
  const boxW = 20;
  const boxX = cx - boxW / 2;
  const wireY = y + WIRE_Y_OFFSET;

  return (
    <g key={key}>
      {/* Label */}
      <text
        x={cx}
        y={y + LABEL_H - 2}
        textAnchor="middle"
        className="fill-primary"
        fontSize={12}
        fontWeight={700}
      >
        {contact.name}
      </text>
      {/* Left wire */}
      <line x1={x} y1={wireY} x2={boxX} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
      {/* Contact box (two vertical lines) */}
      <line x1={boxX} y1={wireY - 12} x2={boxX} y2={wireY + 12} stroke="currentColor" strokeWidth={STROKE} />
      <line x1={boxX + boxW} y1={wireY - 12} x2={boxX + boxW} y2={wireY + 12} stroke="currentColor" strokeWidth={STROKE} />
      {/* Negation slash */}
      {contact.negated && (
        <line
          x1={boxX + 4}
          y1={wireY + 10}
          x2={boxX + boxW - 4}
          y2={wireY - 10}
          stroke="currentColor"
          strokeWidth={STROKE}
        />
      )}
      {/* Right wire */}
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
      {/* Label */}
      <text
        x={cx}
        y={y + LABEL_H - 2}
        textAnchor="middle"
        className="fill-primary"
        fontSize={12}
        fontWeight={700}
      >
        {name}
      </text>
      {/* Left wire */}
      <line x1={x} y1={wireY} x2={cx - r} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
      {/* Coil arcs - left paren */}
      <path
        d={`M ${cx - r} ${wireY - r} Q ${cx - r - 5} ${wireY} ${cx - r} ${wireY + r}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
      />
      {/* Coil arcs - right paren */}
      <path
        d={`M ${cx + r} ${wireY - r} Q ${cx + r + 5} ${wireY} ${cx + r} ${wireY + r}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
      />
      {/* Right wire */}
      <line x1={cx + r} y1={wireY} x2={x + COIL_W} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
    </g>
  );
};

function computeRungLayout(rung: LadderRung) {
  const maxContacts = Math.max(...rung.branches.map((b) => b.contacts.length));
  const contactsEndX = LEFT_PAD + maxContacts * CONTACT_W;
  const gapToCoil = 40;
  const coilX = contactsEndX + gapToCoil;
  const totalW = coilX + COIL_W + LEFT_PAD;
  const totalH = rung.branches.length * ROW_H;
  return { maxContacts, contactsEndX, coilX, totalW, totalH };
}

const RungSVG = ({ rung }: { rung: LadderRung }) => {
  const { maxContacts, contactsEndX, coilX, totalW, totalH } = useMemo(
    () => computeRungLayout(rung),
    [rung]
  );

  const isParallel = rung.branches.length > 1;
  const railRight = totalW;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="w-full text-foreground"
      style={{ maxWidth: totalW, minWidth: 300 }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Left rail */}
      <line x1={RAIL_X} y1={0} x2={RAIL_X} y2={totalH} stroke="currentColor" strokeWidth={STROKE} />
      {/* Right rail */}
      <line x1={railRight} y1={0} x2={railRight} y2={totalH} stroke="currentColor" strokeWidth={STROKE} />

      {rung.branches.map((branch, bi) => {
        const rowY = bi * ROW_H;
        const wireY = rowY + WIRE_Y_OFFSET;
        const elements: JSX.Element[] = [];

        // Wire from left rail to first contact
        elements.push(
          <line
            key={`lw-${bi}`}
            x1={RAIL_X}
            y1={wireY}
            x2={LEFT_PAD}
            y2={wireY}
            stroke="currentColor"
            strokeWidth={STROKE}
          />
        );

        // Draw contacts
        branch.contacts.forEach((c, ci) => {
          const cx = LEFT_PAD + ci * CONTACT_W;
          elements.push(drawContact(cx, rowY, c, `c-${bi}-${ci}`));
        });

        // Wire from last contact to junction point
        const lastContactEnd = LEFT_PAD + branch.contacts.length * CONTACT_W;
        elements.push(
          <line
            key={`rw-${bi}`}
            x1={lastContactEnd}
            y1={wireY}
            x2={contactsEndX}
            y2={wireY}
            stroke="currentColor"
            strokeWidth={STROKE}
          />
        );

        if (!isParallel || bi === 0) {
          // Wire from junction to coil
          elements.push(
            <line
              key={`jw-${bi}`}
              x1={contactsEndX}
              y1={wireY}
              x2={coilX}
              y2={wireY}
              stroke="currentColor"
              strokeWidth={STROKE}
            />
          );
          // Coil
          elements.push(drawCoil(coilX, rowY, rung.output, `coil-${bi}`));
          // Wire from coil to right rail
          elements.push(
            <line
              key={`rrw-${bi}`}
              x1={coilX + COIL_W}
              y1={wireY}
              x2={railRight}
              y2={wireY}
              stroke="currentColor"
              strokeWidth={STROKE}
            />
          );
        }

        return <g key={`branch-${bi}`}>{elements}</g>;
      })}

      {/* Vertical connectors for parallel branches */}
      {isParallel && (
        <>
          {/* Left junction */}
          <line
            x1={LEFT_PAD}
            y1={0 * ROW_H + WIRE_Y_OFFSET}
            x2={LEFT_PAD}
            y2={(rung.branches.length - 1) * ROW_H + WIRE_Y_OFFSET}
            stroke="currentColor"
            strokeWidth={STROKE}
          />
          {/* Right junction */}
          <line
            x1={contactsEndX}
            y1={0 * ROW_H + WIRE_Y_OFFSET}
            x2={contactsEndX}
            y2={(rung.branches.length - 1) * ROW_H + WIRE_Y_OFFSET}
            stroke="currentColor"
            strokeWidth={STROKE}
          />
        </>
      )}
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
