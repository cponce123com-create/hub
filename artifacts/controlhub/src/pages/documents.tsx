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
import { Plus, Search, Trash2, FileText, File } from "lucide-react";

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
  hr: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  finance: "bg-green-500/15 text-green-400 border-green-500/20",
  legal: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  operations: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  security: "bg-red-500/15 text-red-400 border-red-500/20",
  contracts: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  payslips: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  invoices: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  manuals: "bg-pink-500/15 text-pink-400 border-pink-500/20",
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
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    search: search || undefined,
  });

  const { data: employees } = useListEmployees(companyId);

  const createMutation = useCreateDocument({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDocumentsQueryKey(companyId) });
        setShowCreate(false);
        setForm(emptyForm);
        toast({ title: "Documento registrado" });
      },
    },
  });

  const deleteMutation = useDeleteDocument({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDocumentsQueryKey(companyId) });
        setDeleteId(null);
        toast({ title: "Documento eliminado" });
      },
    },
  });

  const handleSubmit = () => {
    if (!form.title) {
      toast({ title: "El titulo es requerido", variant: "destructive" });
      return;
    }
    createMutation.mutate({ companyId, data: {
      title: form.title,
      category: form.category,
      employeeId: form.employeeId ? parseInt(form.employeeId) : undefined,
      fileUrl: form.fileUrl || undefined,
      fileType: form.fileType || undefined,
      notes: form.notes || undefined,
    }});
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Repositorio de Documentos</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestion documental centralizada de la empresa</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setShowCreate(true); }} data-testid="button-create-document">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Documento
          </Button>
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar documentos..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-documents" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44" data-testid="select-category-filter">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorias</SelectItem>
              {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
          </div>
        ) : !documents?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No hay documentos registrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <div key={doc.id} className="rounded-lg border border-border/60 bg-card/50 p-4 flex items-start gap-3 hover:border-primary/30 transition-colors group" data-testid={`card-document-${doc.id}`}>
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <File className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${categoryColors[doc.category] ?? ""}`}>
                      {categoryLabels[doc.category] ?? doc.category}
                    </span>
                    {doc.employeeName && <span className="text-xs text-muted-foreground truncate">{doc.employeeName}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{doc.uploadedBy} &middot; {new Date(doc.createdAt).toLocaleDateString("es-PE")}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => setDeleteId(doc.id)} data-testid={`button-delete-document-${doc.id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo Documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Titulo *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nombre del documento" data-testid="input-document-title" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger data-testid="select-document-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Empleado (opcional)</Label>
                <Select value={form.employeeId} onValueChange={v => setForm(f => ({ ...f, employeeId: v }))}>
                  <SelectTrigger data-testid="select-document-employee"><SelectValue placeholder="Sin empleado asignado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin empleado</SelectItem>
                    {employees?.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>URL del archivo</Label>
                <Input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://..." data-testid="input-document-url" />
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} data-testid="textarea-document-notes" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-document">Registrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar documento</AlertDialogTitle>
              <AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ companyId, documentId: deleteId })} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
