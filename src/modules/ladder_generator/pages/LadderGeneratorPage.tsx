import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Cable, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import PrivateRoute from "@/core/auth/components/PrivateRoute";
import ModuleLayout from "@/shared/components/ModuleLayout";
import { convertToLadder, type LadderResult } from "../utils/convertToLadder";
import LadderDiagram from "../components/LadderDiagram";

const MAX_INPUT_LENGTH = 5000;

const LadderGeneratorContent = () => {
  const [stCode, setStCode] = useState("");
  const [ladderResult, setLadderResult] = useState<LadderResult | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = () => {
    setError("");
    setLadderResult(null);

    try {
      const result = convertToLadder(stCode);
      setLadderResult(result);
      if (result.errors.length > 0) {
        toast.warning(`${result.rungs.length} rungs generados, ${result.errors.length} errores`);
      } else {
        toast.success("Ladder generado correctamente");
      }
    } catch (err: any) {
      setError(err.message || "Error al generar el Ladder.");
    }
  };

  return (
    <ModuleLayout title="Generador de Ladder" icon={Cable}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Código ST</h2>
          <p className="text-sm text-muted-foreground">
            Ingresa lógica booleana simple (AND, OR, NOT). Sin loops ni estructuras complejas.
          </p>
          <Textarea
            value={stCode}
            onChange={(e) => setStCode(e.target.value)}
            placeholder={`// Ejemplo:\nMotor1 := (Start1 OR Motor1) AND NOT Stop1;\nOutput1 := Input1 AND Input2;`}
            className="font-mono text-sm min-h-[300px] resize-y"
            maxLength={MAX_INPUT_LENGTH}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {stCode.length}/{MAX_INPUT_LENGTH}
            </span>
            <Button onClick={handleGenerate}>
              <Cable className="h-4 w-4 mr-2" />
              Generar Ladder
            </Button>
          </div>
        </Card>

        {/* Output */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Resultado Ladder</h2>
          <p className="text-sm text-muted-foreground">
            Representación visual en formato Ladder para PLC.
          </p>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {ladderResult && ladderResult.errors.length > 0 && (
            <div className="space-y-1">
              {ladderResult.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {ladderResult && ladderResult.rungs.length > 0 ? (
            <LadderDiagram rungs={ladderResult.rungs} />
          ) : (
            !error && (
              <div className="min-h-[300px] flex items-center justify-center rounded-lg bg-muted/50">
                <span className="text-muted-foreground italic text-sm">
                  El resultado aparecerá aquí...
                </span>
              </div>
            )
          )}
        </Card>
      </div>
    </ModuleLayout>
  );
};

const LadderGeneratorPage = () => (
  <PrivateRoute>
    <LadderGeneratorContent />
  </PrivateRoute>
);

export default LadderGeneratorPage;
