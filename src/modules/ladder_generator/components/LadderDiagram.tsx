import type { LadderRung } from "../utils/convertToLadder";
import LadderRungSvg from "./LadderRungSvg";

interface LadderDiagramProps {
  rungs: LadderRung[];
}

const LadderDiagram = ({ rungs }: LadderDiagramProps) => (
  <div className="bg-background border border-border rounded-lg p-4 overflow-x-auto space-y-6">
    {rungs.map((rung, i) => (
      <LadderRungSvg key={`${rung.output}-${i}`} rung={rung} />
    ))}
  </div>
);

export default LadderDiagram;
