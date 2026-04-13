import type { LadderRung, LadderContact } from "../utils/convertToLadder";

const ContactSymbol = ({ contact }: { contact: LadderContact }) => (
  <div className="flex flex-col items-center mx-1 flex-shrink-0">
    <span className="text-xs font-semibold text-primary mb-0.5 whitespace-nowrap">
      {contact.name}
    </span>
    <div className="flex items-center h-8">
      <div className="w-5 border-t-2 border-foreground" />
      <div className="flex items-center justify-center w-7 h-8 border-l-2 border-r-2 border-foreground relative">
        {contact.negated && (
          <span className="text-foreground font-bold text-base leading-none">/</span>
        )}
      </div>
      <div className="w-5 border-t-2 border-foreground" />
    </div>
  </div>
);

const CoilSymbol = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center mx-1 flex-shrink-0">
    <span className="text-xs font-semibold text-primary mb-0.5 whitespace-nowrap">
      {name}
    </span>
    <div className="flex items-center h-8">
      <div className="w-6 border-t-2 border-foreground" />
      <div className="flex items-center justify-center w-8 h-8">
        <span className="text-foreground text-xl font-light">(</span>
        <span className="w-2" />
        <span className="text-foreground text-xl font-light">)</span>
      </div>
      <div className="w-2 border-t-2 border-foreground" />
    </div>
  </div>
);

const BranchRow = ({ contacts }: { contacts: LadderContact[] }) => (
  <div className="flex items-end">
    {contacts.map((c, i) => (
      <ContactSymbol key={i} contact={c} />
    ))}
  </div>
);

const Rung = ({ rung }: { rung: LadderRung }) => {
  const isParallel = rung.branches.length > 1;

  if (!isParallel) {
    return (
      <div className="flex items-stretch">
        <div className="w-0.5 bg-foreground flex-shrink-0" />
        <div className="flex items-end flex-1 py-1">
          <div className="w-3 border-t-2 border-foreground self-center mb-4" />
          <BranchRow contacts={rung.branches[0].contacts} />
          <div className="flex-1 border-t-2 border-foreground self-center mb-4 min-w-4" />
          <CoilSymbol name={rung.output} />
        </div>
        <div className="w-0.5 bg-foreground flex-shrink-0" />
      </div>
    );
  }

  // Parallel branches
  return (
    <div className="flex items-stretch">
      <div className="w-0.5 bg-foreground flex-shrink-0" />
      <div className="flex-1 py-1 relative">
        {rung.branches.map((branch, i) => (
          <div key={i} className="flex items-end relative">
            {/* Left vertical connector */}
            {i > 0 && (
              <div
                className="absolute bg-foreground"
                style={{ left: '12px', top: 0, bottom: '50%', width: '2px' }}
              />
            )}
            {i < rung.branches.length - 1 && (
              <div
                className="absolute bg-foreground"
                style={{ left: '12px', top: '50%', bottom: 0, width: '2px' }}
              />
            )}

            <div className="w-3 border-t-2 border-foreground self-center mb-4" />
            <BranchRow contacts={branch.contacts} />

            {i === 0 ? (
              <>
                <div className="flex-1 border-t-2 border-foreground self-center mb-4 min-w-4" />
                <CoilSymbol name={rung.output} />
              </>
            ) : (
              <div className="flex-1 self-center mb-4" />
            )}
          </div>
        ))}
      </div>
      <div className="w-0.5 bg-foreground flex-shrink-0" />
    </div>
  );
};

interface LadderDiagramProps {
  rungs: LadderRung[];
}

const LadderDiagram = ({ rungs }: LadderDiagramProps) => (
  <div className="bg-background border border-border rounded-lg p-4 overflow-auto">
    {rungs.map((rung, i) => (
      <Rung key={i} rung={rung} />
    ))}
  </div>
);

export default LadderDiagram;
