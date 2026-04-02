import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useCompany } from "@/context/CompanyContext";
import {
  useListDocuments,
  useCreateDocument,
  useDeleteDocument,
  useListEmployees,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, FileText, Download, UploadCloud, FolderOpen } from "lucide-react";

const categoryLabels: Record<string, string> = {
  hr: "RRHH",
  finance: "Finanzas",
  legal: "Legal",
  operations: "Operaciones",
  security: "Seguridad",
  contracts: "Contratos",
  payslips: "Boletas",
  invoices: "Facturas",
  manuals: "Manuales",
  other: "Otros",
};

const categoryColors: Record<string, string> = {
  hr: "bg-blue-500/15 text-blue-500 border-blue-500/20",
  finance: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  legal: "bg-purple-500/15 text-purple-500 border-purple-500/20",
  operations: "bg-orange-500/15 text-orange-500 border-orange-500/20",
  security: "bg-red-500/15 text-red-500 border-red-500/20",
  contracts: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20",
  payslips: "bg-cyan-500/15 text-cyan-500 border-cyan-500/20",
  invoices: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  manuals: "bg-pink-500/15 text-pink-500 border-pink-500/20",
  other: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

interface DocForm {
  title: string;
  category: string;
  employeeId: string;
  fileUrl: string;
  fileType: string;
  notes: string;
}

const emptyForm: DocForm = { title: "", category: "other", employeeId: "", fileUrl: "", fileType: "", notes: "" };

export default function Documents() {
  const { companyId } = useCompany();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<DocForm>(emptyForm);

  const { data: documents, isLoading } = useListDocuments(companyId, {
    query: { enabled: !!companyId, queryKey: getListDocumentsQueryKey(companyId) }
  });

  const filteredDocuments = documents?.filter(doc => {
    const matchCat = categoryFilter === "all" || doc.category === categoryFilter;
    const matchSearch = search ? doc.title.toLowerCase().includes(search.toLowerCase()) || doc.employeeName?.toLowerCase().includes(search.toLowerCase()) : true;
    return matchCat && matchSearch;
  });

  const { data: employees } = useListEmployees(companyId, { query: { enabled: !!companyId } });

  const createMutation = useCreateDocument({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDocumentsQueryKey(companyId) });
        setShowCreate(false);
        setForm(emptyForm);
        toast({ title: "Documento subido exitosamente" });
      },
    },
  });

  const deleteMutation = useDeleteDocument({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDocumentsQueryKey(companyId) });
        setDeleteId(null);
        toast({ title: "Documento eliminado", description: "El archivo ha sido removido del repositorio." });
      },
    },
  });

  const handleSubmit = () => {
    if (!form.title) {
      toast({ title: "Título requerido", description: "Debes asignar un nombre al documento.", variant: "destructive" });
      return;
    }
    createMutation.mutate({ companyId, data: {
      title: form.title,
      category: form.category as any,
      employeeId: form.employeeId ? parseInt(form.employeeId) : undefined,
      fileUrl: form.fileUrl || undefined,
      fileType: form.fileType || undefined,
      notes: form.notes || undefined,
    }});
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Repositorio Documental</h1>
            <p className="text-muted-foreground mt-1 text-base">Archivos centralizados de la empresa y empleados.</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="shadow-lg shadow-primary/20" data-testid="button-create-document">
            <UploadCloud className="w-5 h-5 mr-2" /> Subir Archivo
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border/40 shadow-sm">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre de archivo o empleado..." 
              className="pl-9 h-10 bg-muted/50 border-border/50" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              data-testid="input-search-documents" 
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[220px] h-10 bg-muted/50 border-border/50" data-testid="select-category-filter">
              <SelectValue placeholder="Clasificación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las carpetas</SelectItem>
              {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl border border-border/40 bg-card">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !filteredDocuments?.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-12 bg-card rounded-xl border border-border/40 shadow-sm">
            <FolderOpen className="w-16 h-16 text-muted-foreground/20 mb-4" />
            <p className="text-xl font-semibold text-foreground">Carpeta Vacía</p>
            <p className="text-muted-foreground mt-2 max-w-sm">No se encontraron documentos con los filtros actuales. Sube un nuevo archivo para empezar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map(doc => (
              <div key={doc.id} className="rounded-xl border border-border/40 bg-card p-5 flex flex-col gap-4 hover:bg-card/80 hover:border-primary/30 transition-colors shadow-sm group" data-testid={`card-document-${doc.id}`}>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center shrink-0 border border-border/50 shadow-inner text-muted-foreground">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate leading-tight" title={doc.title}>{doc.title}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border mt-1.5 ${categoryColors[doc.category] ?? ""}`}>
                      {categoryLabels[doc.category] ?? doc.category}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1.5 flex-1 pt-2">
                  {doc.employeeName ? (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground/80">Titular:</span> {doc.employeeName}
                    </div>
                  ) : null}
                  <div className="text-xs text-muted-foreground">
                    Subido por {doc.uploadedBy}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString("es-PE", { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border/40 mt-auto">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-medium bg-background/50 hover:bg-background">
                    <Download className="w-3.5 h-3.5 mr-2" /> Descargar
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-border/40 shrink-0" onClick={() => setDeleteId(doc.id)} data-testid={`button-delete-document-${doc.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md bg-card border-border/40 shadow-2xl">
            <DialogHeader className="border-b border-border/40 pb-4">
              <DialogTitle className="text-xl">Subir Nuevo Documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-foreground/80 font-medium">Título del Archivo *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej. Contrato de Trabajo 2024" className="mt-1.5 h-10" data-testid="input-document-title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground/80 font-medium">Categoría *</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="mt-1.5 h-10" data-testid="select-document-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground/80 font-medium">Asignar a Empleado</Label>
                  <Select value={form.employeeId} onValueChange={v => setForm(f => ({ ...f, employeeId: v }))}>
                    <SelectTrigger className="mt-1.5 h-10" data-testid="select-document-employee"><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General / Empresa</SelectItem>
                      {employees?.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">URL del Archivo</Label>
                <Input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://almacenamiento.com/..." className="mt-1.5 h-10" data-testid="input-document-url" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Descripción Corta</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="mt-1.5 resize-none bg-muted/30" data-testid="textarea-document-notes" />
              </div>
            </div>
            <DialogFooter className="border-t border-border/40 pt-4">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="shadow-lg shadow-primary/20" data-testid="button-submit-document">Guardar Documento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent className="bg-card border-border/40">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">¿Eliminar documento?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Esta acción eliminará la referencia del documento de la base de datos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ companyId, documentId: deleteId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20">Sí, eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
