import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useCompany } from "@/context/CompanyContext";
import {
  useListInvoices,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useListSuppliers,
  getListInvoicesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Search, Trash2, Edit, FileText } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  paid: "bg-green-500/15 text-green-400 border-green-500/20",
  overdue: "bg-red-500/15 text-red-400 border-red-500/20",
  cancelled: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  observed: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  scheduled: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Anulada",
  observed: "Observada",
  scheduled: "Programada",
};

interface InvoiceForm {
  supplierId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: string;
  currency: string;
  status: string;
  category: string;
  costCenter: string;
  notes: string;
}

const emptyForm: InvoiceForm = {
  supplierId: "",
  invoiceNumber: "",
  issueDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  amount: "",
  currency: "PEN",
  status: "pending",
  category: "",
  costCenter: "",
  notes: "",
};

export default function Invoices() {
  const { companyId } = useCompany();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editInvoice, setEditInvoice] = useState<{ id: number } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);

  const { data: invoices, isLoading } = useListInvoices(companyId, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
  });

  const { data: suppliers } = useListSuppliers(companyId);

  const createMutation = useCreateInvoice({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListInvoicesQueryKey(companyId) });
        setShowCreate(false);
        setForm(emptyForm);
        toast({ title: "Factura creada correctamente" });
      },
    },
  });

  const updateMutation = useUpdateInvoice({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListInvoicesQueryKey(companyId) });
        setEditInvoice(null);
        toast({ title: "Factura actualizada" });
      },
    },
  });

  const deleteMutation = useDeleteInvoice({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListInvoicesQueryKey(companyId) });
        setDeleteId(null);
        toast({ title: "Factura eliminada" });
      },
    },
  });

  const handleSubmit = () => {
    if (!form.supplierId || !form.invoiceNumber || !form.amount) {
      toast({ title: "Completa los campos requeridos", variant: "destructive" });
      return;
    }
    const data = {
      supplierId: parseInt(form.supplierId),
      invoiceNumber: form.invoiceNumber,
      issueDate: form.issueDate,
      dueDate: form.dueDate || form.issueDate,
      amount: parseFloat(form.amount),
      currency: form.currency,
      status: form.status,
      category: form.category || undefined,
      costCenter: form.costCenter || undefined,
      notes: form.notes || undefined,
    };
    if (editInvoice) {
      updateMutation.mutate({ companyId, invoiceId: editInvoice.id, data });
    } else {
      createMutation.mutate({ companyId, data });
    }
  };

  const openEdit = (invoice: typeof invoices extends Array<infer T> ? T : never) => {
    setForm({
      supplierId: String(invoice.supplierId),
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      amount: String(invoice.amount),
      currency: invoice.currency,
      status: invoice.status,
      category: invoice.category ?? "",
      costCenter: invoice.costCenter ?? "",
      notes: invoice.notes ?? "",
    });
    setEditInvoice({ id: invoice.id });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestiona facturas por pagar y pagadas</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setEditInvoice(null); setShowCreate(true); }} data-testid="button-create-invoice">
            <Plus className="w-4 h-4 mr-2" /> Nueva Factura
          </Button>
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar facturas..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-search-invoices"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="paid">Pagada</SelectItem>
              <SelectItem value="overdue">Vencida</SelectItem>
              <SelectItem value="cancelled">Anulada</SelectItem>
              <SelectItem value="scheduled">Programada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">N. Factura</TableHead>
                <TableHead className="text-muted-foreground font-medium">Proveedor</TableHead>
                <TableHead className="text-muted-foreground font-medium">Emision</TableHead>
                <TableHead className="text-muted-foreground font-medium">Vencimiento</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Monto</TableHead>
                <TableHead className="text-muted-foreground font-medium">Estado</TableHead>
                <TableHead className="text-muted-foreground font-medium">Categoria</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border/60">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !invoices?.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No hay facturas registradas</p>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map(inv => (
                  <TableRow key={inv.id} className="border-border/60" data-testid={`row-invoice-${inv.id}`}>
                    <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                    <TableCell className="font-medium">{inv.supplierName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{inv.issueDate}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{inv.dueDate}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {inv.currency} {Number(inv.amount).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusColors[inv.status] ?? ""}`}>
                        {statusLabels[inv.status] ?? inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{inv.category ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(inv)} data-testid={`button-edit-invoice-${inv.id}`}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(inv.id)} data-testid={`button-delete-invoice-${inv.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreate || !!editInvoice} onOpenChange={open => { if (!open) { setShowCreate(false); setEditInvoice(null); } }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editInvoice ? "Editar Factura" : "Nueva Factura"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2">
                <Label>Proveedor *</Label>
                <Select value={form.supplierId} onValueChange={v => setForm(f => ({ ...f, supplierId: v }))}>
                  <SelectTrigger data-testid="select-invoice-supplier">
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>N. Factura *</Label>
                <Input value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} placeholder="F001-00001" data-testid="input-invoice-number" />
              </div>
              <div>
                <Label>Monto *</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" data-testid="input-invoice-amount" />
              </div>
              <div>
                <Label>Fecha Emision</Label>
                <Input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} data-testid="input-invoice-issue-date" />
              </div>
              <div>
                <Label>Fecha Vencimiento</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} data-testid="input-invoice-due-date" />
              </div>
              <div>
                <Label>Moneda</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEN">PEN - Soles</SelectItem>
                    <SelectItem value="USD">USD - Dolares</SelectItem>
                    <SelectItem value="EUR">EUR - Euros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger data-testid="select-invoice-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="paid">Pagada</SelectItem>
                    <SelectItem value="overdue">Vencida</SelectItem>
                    <SelectItem value="cancelled">Anulada</SelectItem>
                    <SelectItem value="scheduled">Programada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Servicios, Materiales..." data-testid="input-invoice-category" />
              </div>
              <div>
                <Label>Centro de Costo</Label>
                <Input value={form.costCenter} onChange={e => setForm(f => ({ ...f, costCenter: e.target.value }))} data-testid="input-invoice-cost-center" />
              </div>
              <div className="col-span-2">
                <Label>Observaciones</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} data-testid="textarea-invoice-notes" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); setEditInvoice(null); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-invoice">
                {editInvoice ? "Guardar cambios" : "Crear factura"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar factura</AlertDialogTitle>
              <AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ companyId, invoiceId: deleteId })} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
