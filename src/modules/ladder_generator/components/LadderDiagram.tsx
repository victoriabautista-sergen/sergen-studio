import type { LadderRung, LadderContact, LadderBranch } from "../utils/convertToLadder";

const ContactSymbol = ({ contact }: { contact: LadderContact }) => (
  <div className="flex flex-col items-center flex-shrink-0" style={{ width: 70 }}>
    <span className="text-xs font-bold text-primary mb-1 whitespace-nowrap truncate max-w-full">
      {contact.name}
    </span>
    <div className="flex items-center h-7 w-full">
      {/* Left wire */}
      <div className="flex-1 h-0 border-t-2 border-foreground" />
      {/* Contact box */}
      <div className="flex items-center justify-center w-6 h-7 border-l-2 border-r-2 border-foreground">
        {contact.negated && (
          <span className="text-foreground font-bold text-sm leading-none">/</span>
        )}
      </div>
      {/* Right wire */}
      <div className="flex-1 h-0 border-t-2 border-foreground" />
    </div>
  </div>
);

const CoilSymbol = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center flex-shrink-0" style={{ width: 70 }}>
    <span className="text-xs font-bold text-primary mb-1 whitespace-nowrap truncate max-w-full">
      {name}
    </span>
    <div className="flex items-center h-7 w-full">
      <div className="flex-1 h-0 border-t-2 border-foreground" />
      <div className="flex items-center justify-center">
        <span className="text-foreground text-lg leading-none">(</span>
        <span className="w-2" />
        <span className="text-foreground text-lg leading-none">)</span>
      </div>
      <div className="w-1 h-0 border-t-2 border-foreground" />
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

/** Compute max number of contacts in any branch for alignment */
function maxContactsWidth(branches: LadderBranch[]): number {
  return Math.max(...branches.map(b => b.contacts.length));
}

const SingleRung = ({ rung }: { rung: LadderRung }) => (
  <div className="flex items-stretch">
    {/* Left rail */}
    <div className="w-0.5 bg-foreground flex-shrink-0" />
    <div className="flex items-end flex-1 py-2">
      {/* Wire from left rail */}
      <div className="w-2 border-t-2 border-foreground self-center mb-[14px]" />
      <BranchContacts contacts={rung.branches[0].contacts} />
      {/* Wire to coil */}
      <div className="flex-1 border-t-2 border-foreground self-center mb-[14px] min-w-6" />
      <CoilSymbol name={rung.output} />
      {/* Wire to right rail */}
      <div className="w-2 border-t-2 border-foreground self-center mb-[14px]" />
    </div>
    {/* Right rail */}
    <div className="w-0.5 bg-foreground flex-shrink-0" />
  </div>
);

const ParallelRung = ({ rung }: { rung: LadderRung }) => {
  const maxW = maxContactsWidth(rung.branches);
  // Each contact is 70px wide
  const contactAreaWidth = maxW * 70;

  return (
    <div className="flex items-stretch">
      {/* Left rail */}
      <div className="w-0.5 bg-foreground flex-shrink-0" />

      <div className="flex-1 relative py-2">
        {/* Left vertical connector for parallel branches */}
        <div
          className="absolute bg-foreground"
          style={{
            left: 8,
            top: `calc(50% - ${(rung.branches.length - 1) * 24}px)`,
            bottom: `calc(50% - ${(rung.branches.length - 1) * 24}px)`,
            width: 2,
          }}
        />

        {rung.branches.map((branch, i) => {
          const emptySlots = maxW - branch.contacts.length;
          return (
            <div key={i} className="flex items-end">
              {/* Wire from left connector */}
              <div className="w-2 border-t-2 border-foreground self-center mb-[14px]" />

              <BranchContacts contacts={branch.contacts} />

              {/* Spacer for shorter branches */}
              {emptySlots > 0 && (
                <div style={{ width: emptySlots * 70 }} className="border-t-2 border-foreground self-center mb-[14px]" />
              )}

              {i === 0 ? (
                <>
                  {/* Wire + right junction + coil */}
                  <div className="flex-1 border-t-2 border-foreground self-center mb-[14px] min-w-6" />
                  <CoilSymbol name={rung.output} />
                  <div className="w-2 border-t-2 border-foreground self-center mb-[14px]" />
                </>
              ) : (
                /* Lower branches: just end wire connecting back up */
                <div className="flex-1 self-center mb-[14px]" />
              )}
            </div>
          );
        })}

        {/* Right vertical connector for parallel branches (before coil) */}
        <div
          className="absolute bg-foreground"
          style={{
            left: contactAreaWidth + 10,
            top: `calc(50% - ${(rung.branches.length - 1) * 24}px)`,
            bottom: `calc(50% - ${(rung.branches.length - 1) * 24}px)`,
            width: 2,
          }}
        />
      </div>

      {/* Right rail */}
      <div className="w-0.5 bg-foreground flex-shrink-0" />
    </div>
  );
};

const Rung = ({ rung }: { rung: LadderRung }) => {
  if (rung.branches.length <= 1) return <SingleRung rung={rung} />;
  return <ParallelRung rung={rung} />;
};

interface LadderDiagramProps {
  rungs: LadderRung[];
}

const LadderDiagram = ({ rungs }: LadderDiagramProps) => (
  <div className="bg-background border border-border rounded-lg p-6 overflow-x-auto">
    {rungs.map((rung, i) => (
      <Rung key={i} rung={rung} />
    ))}
  </div>
);

export default LadderDiagram;
