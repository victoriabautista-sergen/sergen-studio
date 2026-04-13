import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Cable, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PrivateRoute from "@/core/auth/components/PrivateRoute";
import ModuleLayout from "@/shared/components/ModuleLayout";

const MAX_INPUT_LENGTH = 5000;

const LadderGeneratorContent = () => {
  const [stCode, setStCode] = useState("");
  const [ladderOutput, setLadderOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setError("");
    setLadderOutput("");

    const trimmed = stCode.trim();
    if (!trimmed) {
      setError("El campo de código ST no puede estar vacío.");
      return;
    }
    if (trimmed.length > MAX_INPUT_LENGTH) {
      setError(`El código no debe exceder ${MAX_INPUT_LENGTH} caracteres.`);
      return;
    }

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "generate-ladder",
        { body: { st_code: trimmed } }
      );

      if (fnError) throw fnError;

      if (data?.error) {
        setError(data.error);
      } else {
        setLadderOutput(data.ladder || "");
        toast.success("Ladder generado correctamente");
      }
    } catch (err: any) {
      setError(err.message || "Error al generar el Ladder.");
      toast.error("Error al generar el Ladder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModuleLayout
      title="Generador de Ladder"
      subtitle="Convierte lógica Structured Text (ST) a formato Ladder para PLCs"
      icon={Cable}
    >
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
            placeholder={`// Ejemplo:\nOutput1 := Input1 AND Input2;\nOutput2 := Input3 OR NOT Input4;`}
            className="font-mono text-sm min-h-[300px] resize-y"
            maxLength={MAX_INPUT_LENGTH}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {stCode.length}/{MAX_INPUT_LENGTH}
            </span>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Cable className="h-4 w-4 mr-2" />
              )}
              Generar Ladder
            </Button>
          </div>
        </Card>

        {/* Output */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Resultado Ladder</h2>
          <p className="text-sm text-muted-foreground">
            Representación en formato Ladder (tipo rungs) para PLC.
          </p>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <pre className="font-mono text-sm bg-muted/50 rounded-lg p-4 min-h-[300px] overflow-auto whitespace-pre text-foreground">
            {ladderOutput || (
              <span className="text-muted-foreground italic">
                El resultado aparecerá aquí...
              </span>
            )}
          </pre>
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
