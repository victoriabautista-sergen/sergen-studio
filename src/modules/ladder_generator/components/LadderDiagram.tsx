import type { LadderRung, LadderContact } from "../utils/convertToLadder";

const ContactSymbol = ({ contact }: { contact: LadderContact }) => (
  <div className="flex flex-col items-center mx-1">
    <span className="text-xs font-semibold text-blue-500 mb-0.5 whitespace-nowrap">
      {contact.name}
    </span>
    <div className="flex items-center h-8">
      <div className="w-6 border-t-2 border-foreground" />
      <div className="flex items-center justify-center w-8 h-8 border-l-2 border-r-2 border-foreground relative">
        {contact.negated && (
          <span className="text-foreground font-bold text-lg leading-none">/</span>
        )}
      </div>
      <div className="w-6 border-t-2 border-foreground" />
    </div>
  </div>
);

const CoilSymbol = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center mx-1">
    <span className="text-xs font-semibold text-blue-500 mb-0.5 whitespace-nowrap">
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

const BranchContacts = ({ contacts }: { contacts: LadderContact[] }) => (
  <div className="flex items-end">
    {contacts.map((c, i) => (
      <ContactSymbol key={i} contact={c} />
    ))}
  </div>
);

const Rung = ({ rung }: { rung: LadderRung }) => {
  const isParallel = rung.branches.length > 1;

  return (
    <div className="flex items-stretch my-2">
      {/* Left power rail */}
      <div className="w-1 bg-foreground flex-shrink-0" />

      {/* Rung content */}
      <div className="flex items-center flex-1">
        {isParallel ? (
          <div className="flex items-center">
            {/* Parallel branches */}
            <div className="flex flex-col relative">
              {/* Vertical connector line on left */}
              <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-foreground" style={{ left: '0px' }} />
              {/* Vertical connector line on right of branch area */}

              {rung.branches.map((branch, i) => (
                <div key={i} className="flex items-end relative">
                  {/* Horizontal stub from rail */}
                  <div className="w-4 border-t-2 border-foreground self-center mb-4" />
                  <BranchContacts contacts={branch.contacts} />
                  {i === 0 && (
                    <div className="flex items-end">
                      {/* Connection line to coil */}
                      <div className="w-8 border-t-2 border-foreground self-center mb-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Coil */}
            <div className="flex items-center">
              <CoilSymbol name={rung.output} />
            </div>
          </div>
        ) : (
          <div className="flex items-end">
            <div className="w-4 border-t-2 border-foreground self-center mb-4" />
            <BranchContacts contacts={rung.branches[0].contacts} />
            <div className="w-8 border-t-2 border-foreground self-center mb-4" />
            <CoilSymbol name={rung.output} />
          </div>
        )}
      </div>

      {/* Right power rail */}
      <div className="w-1 bg-foreground flex-shrink-0" />
    </div>
  );
};

interface LadderDiagramProps {
  rungs: LadderRung[];
}

const LadderDiagram = ({ rungs }: LadderDiagramProps) => {
  return (
    <div className="bg-background border border-border rounded-lg p-4 overflow-auto">
      {/* Top rail */}
      <div className="flex">
        <div className="w-1 h-2 bg-foreground" />
        <div className="flex-1" />
        <div className="w-1 h-2 bg-foreground" />
      </div>

      {rungs.map((rung, i) => (
        <Rung key={i} rung={rung} />
      ))}

      {/* Bottom rail */}
      <div className="flex">
        <div className="w-1 h-2 bg-foreground" />
        <div className="flex-1" />
        <div className="w-1 h-2 bg-foreground" />
      </div>
    </div>
  );
};

export default LadderDiagram;
