import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Company {
  id: string;
  company_name: string;
  ruc: string | null;
  industry: string | null;
}

const EmpresaInfoTab = ({ company }: { company: Company }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRuc, setEditRuc] = useState("");
  const [editIndustry, setEditIndustry] = useState("");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").update({
        company_name: editName.trim(),
        ruc: editRuc.trim() || null,
        industry: editIndustry.trim() || null,
      }).eq("id", company.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Empresa actualizada." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa", company.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      setEditOpen(false);
    },
    onError: () => toast({ title: "Error al actualizar.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").delete().eq("id", company.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Empresa eliminada." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      navigate("/admin-panel/empresas");
    },
    onError: () => toast({ title: "Error al eliminar.", variant: "destructive" }),
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Datos generales</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              setEditName(company.company_name);
              setEditRuc(company.ruc ?? "");
              setEditIndustry(company.industry ?? "");
              setEditOpen(true);
            }}>
              <Pencil className="h-4 w-4 mr-2" />Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />Eliminar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Nombre</p>
            <p className="font-medium">{company.company_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">RUC</p>
            <p className="font-medium">{company.ruc ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Industria</p>
            <p className="font-medium">{company.industry ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar empresa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>RUC</Label>
              <Input value={editRuc} onChange={(e) => setEditRuc(e.target.value)} placeholder="20123456789" />
            </div>
            <div className="space-y-2">
              <Label>Industria</Label>
              <Input value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !editName.trim()}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción eliminará la empresa y todos sus datos. No se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate()}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EmpresaInfoTab;
