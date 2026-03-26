import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Option {
  value: string;
  label: string;
}

interface SearchableComboboxProps {
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
  onCreate?: (label: string) => void;
  placeholder?: string;
  createLabel?: string;
}

const SearchableCombobox = ({
  options,
  value,
  onSelect,
  onCreate,
  placeholder = "Seleccionar...",
  createLabel = "Crear nuevo",
}: SearchableComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newValue, setNewValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = options.find((o) => o.value === value)?.label;

  useEffect(() => {
    if (creating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating]);

  const handleCreate = () => {
    if (newValue.trim() && onCreate) {
      onCreate(newValue.trim());
      setNewValue("");
      setCreating(false);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex-1 justify-between font-normal"
        >
          <span className="truncate">
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1">
          {filtered.length === 0 && !creating && (
            <p className="text-xs text-muted-foreground p-2 text-center">Sin resultados</p>
          )}
          {filtered.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                setOpen(false);
                setSearch("");
              }}
              className={cn(
                "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer text-left",
                value === option.value && "bg-accent"
              )}
            >
              <Check
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  value === option.value ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
        {onCreate && (
          <div className="border-t p-2">
            {creating ? (
              <div className="flex gap-1">
                <Input
                  ref={inputRef}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Nombre..."
                  className="h-8 text-sm flex-1"
                />
                <Button size="sm" className="h-8 px-2" onClick={handleCreate}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent text-primary cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                {createLabel}
              </button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default SearchableCombobox;
