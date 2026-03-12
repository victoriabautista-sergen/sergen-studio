import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/core/auth/context/AuthContext";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));

const EmpresaReportesTab = ({ companyId }: { companyId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-empresa-reports", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports")
        .select("id, title, content, created_at, created_by, module_slug")
        .eq("client_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const filePath = `reports/${companyId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("invoices").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("invoices").getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("reports").insert({
        client_id: companyId,
        title: file.name,
        module_slug: "admin",
        content: { file_url: publicUrl, file_path: filePath },
        created_by: user.id,
      });
      if (insertError) throw insertError;

      toast({ title: "Reporte subido correctamente." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-reports", companyId] });
    } catch {
      toast({ title: "Error al subir reporte.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const report = reports.find((r) => r.id === reportId);
      if (report?.content && typeof report.content === "object" && "file_path" in (report.content as any)) {
        await supabase.storage.from("invoices").remove([(report.content as any).file_path]);
      }
      // We can't delete reports with current RLS, but let's try
      const { error } = await supabase.from("reports").delete().eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Reporte eliminado." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-reports", companyId] });
      setDeletingId(null);
    },
    onError: () => toast({ title: "Error al eliminar.", variant: "destructive" }),
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Reportes</CardTitle>
            <CardDescription>Documentos y reportes asociados a esta empresa.</CardDescription>
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xlsx,.xls" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); e.target.value = ""; }} />
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Subir reporte
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : reports.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-3 text-muted-foreground">
              <FileText className="h-8 w-8" /><p className="text-sm">No hay reportes</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => {
                  const fileUrl = (r.content as any)?.file_url;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                      <TableCell className="text-right flex justify-end gap-1">
                        {fileUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeletingId(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(deletingId)} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reporte?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deletingId) deleteMutation.mutate(deletingId); }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EmpresaReportesTab;
