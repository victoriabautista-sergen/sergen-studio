import { useMemo } from "react";
import type { JSX } from "react";
import type { CoilType, LadderBlock, LadderContact, LadderRung } from "../utils/convertToLadder";

const CONTACT_W = 90;
const CONTACT_H = 40;
const LABEL_H = 16;
const ROW_H = CONTACT_H + LABEL_H + 12;
const COIL_W = 90;
const LEFT_PAD = 12;
const GAP_TO_COIL = 30;
const WIRE_Y_OFFSET = LABEL_H + CONTACT_H / 2;
const STROKE = 2;

interface BlockMetrics {
  width: number;
  height: number;
}

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

const drawCoil = (x: number, y: number, name: string, coilType: CoilType, key: string) => {
  const cx = x + COIL_W / 2;
  const wireY = y + WIRE_Y_OFFSET;
  const r = 12;

  const label = coilType === "set" ? "S" : coilType === "reset" ? "R" : "";

  return (
    <g key={key}>
      <text x={cx} y={y + LABEL_H - 2} textAnchor="middle" className="fill-primary" fontSize={11} fontWeight={700}>
        {name}
      </text>
      <line x1={x} y1={wireY} x2={cx - r} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
      <path d={`M ${cx - r} ${wireY - r} Q ${cx - r - 5} ${wireY} ${cx - r} ${wireY + r}`} fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <path d={`M ${cx + r} ${wireY - r} Q ${cx + r + 5} ${wireY} ${cx + r} ${wireY + r}`} fill="none" stroke="currentColor" strokeWidth={STROKE} />
      {label && (
        <text x={cx} y={wireY + 4} textAnchor="middle" className="fill-foreground" fontSize={11} fontWeight={700}>
          {label}
        </text>
      )}
      <line x1={cx + r} y1={wireY} x2={x + COIL_W} y2={wireY} stroke="currentColor" strokeWidth={STROKE} />
    </g>
  );
};

function getBlockMetrics(block: LadderBlock): BlockMetrics {
  if (!block || !block.type) {
    return { width: CONTACT_W, height: ROW_H };
  }

  if (block.type === "contact") {
    return { width: CONTACT_W, height: ROW_H };
  }

  if (block.type === "series") {
    const childMetrics = block.children.map(getBlockMetrics);
    return {
      width: childMetrics.reduce((sum, child) => sum + child.width, 0),
      height: Math.max(...childMetrics.map((child) => child.height), ROW_H),
    };
  }

  const branchMetrics = block.branches.map(getBlockMetrics);
  return {
    width: Math.max(...branchMetrics.map((branch) => branch.width), CONTACT_W),
    height: branchMetrics.reduce((sum, branch) => sum + branch.height, 0),
  };
}

function renderBlock(block: LadderBlock, x: number, y: number, key: string): JSX.Element[] {
  if (!block || !block.type) {
    return [];
  }

  if (block.type === "contact") {
    return [drawContact(x, y, block.contact, key)];
  }

  if (block.type === "series") {
    const elements: JSX.Element[] = [];
    let currentX = x;

    block.children.forEach((child, index) => {
      elements.push(...renderBlock(child, currentX, y, `${key}-series-${index}`));
      currentX += getBlockMetrics(child).width;
    });

    return elements;
  }

  const branchMetrics = block.branches.map(getBlockMetrics);
  const blockWidth = Math.max(...branchMetrics.map((branch) => branch.width), CONTACT_W);
  const elements: JSX.Element[] = [];
  const branchWireYs: number[] = [];
  let currentY = y;

  block.branches.forEach((branch, index) => {
    const metrics = branchMetrics[index];
    const wireY = currentY + WIRE_Y_OFFSET;
    branchWireYs.push(wireY);
    elements.push(...renderBlock(branch, x, currentY, `${key}-branch-${index}`));

    if (metrics.width < blockWidth) {
      elements.push(
        <line
          key={`${key}-branch-wire-${index}`}
          x1={x + metrics.width}
          y1={wireY}
          x2={x + blockWidth}
          y2={wireY}
          stroke="currentColor"
          strokeWidth={STROKE}
        />
      );
    }

    currentY += metrics.height;
  });

  if (branchWireYs.length > 1) {
    const topWireY = branchWireYs[0];
    const bottomWireY = branchWireYs[branchWireYs.length - 1];

    elements.push(
      <line
        key={`${key}-split`}
        x1={x}
        y1={topWireY}
        x2={x}
        y2={bottomWireY}
        stroke="currentColor"
        strokeWidth={STROKE}
      />
    );
    elements.push(
      <line
        key={`${key}-merge`}
        x1={x + blockWidth}
        y1={topWireY}
        x2={x + blockWidth}
        y2={bottomWireY}
        stroke="currentColor"
        strokeWidth={STROKE}
      />
    );
  }

  return elements;
}

const LadderRungSvg = ({ rung }: { rung: LadderRung }) => {
  const blockMetrics = useMemo(() => getBlockMetrics(rung.block), [rung.block]);
  const mainWireY = WIRE_Y_OFFSET;
  const blockEndX = LEFT_PAD + blockMetrics.width;
  const coilX = blockEndX + GAP_TO_COIL;
  const totalW = coilX + COIL_W + LEFT_PAD;
  const totalH = blockMetrics.height;

  const elements = useMemo(() => {
    const svgElements: JSX.Element[] = [
      <line key="rail-l" x1={0} y1={0} x2={0} y2={totalH} stroke="currentColor" strokeWidth={STROKE + 1} />,
      <line key="rail-r" x1={totalW} y1={0} x2={totalW} y2={totalH} stroke="currentColor" strokeWidth={STROKE + 1} />,
      <line key="wire-start" x1={0} y1={mainWireY} x2={LEFT_PAD} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE} />,
      ...renderBlock(rung.block, LEFT_PAD, 0, `${rung.output}-block`),
      <line key="wire-to-coil" x1={blockEndX} y1={mainWireY} x2={coilX} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE} />,
      drawCoil(coilX, 0, rung.output, rung.coilType, "coil"),
      <line key="wire-end" x1={coilX + COIL_W} y1={mainWireY} x2={totalW} y2={mainWireY} stroke="currentColor" strokeWidth={STROKE} />,
    ];

    return svgElements;
  }, [blockEndX, coilX, mainWireY, rung.block, rung.output, totalH, totalW]);

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="w-full text-foreground"
      style={{ maxWidth: totalW, minWidth: 300 }}
      preserveAspectRatio="xMinYMid meet"
    >
      {elements}
    </svg>
  );
};

export default LadderRungSvg;