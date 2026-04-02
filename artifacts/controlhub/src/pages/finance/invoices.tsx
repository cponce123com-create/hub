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
import { Plus, Search, Trash2, Edit, FileText, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
    query: {
      enabled: !!companyId,
      queryKey: getListInvoicesQueryKey(companyId)
    }
  });

  const filteredInvoices = invoices?.filter(inv => {
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchSearch = search ? inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || inv.supplierName.toLowerCase().includes(search.toLowerCase()) : true;
    return matchStatus && matchSearch;
  });

  const { data: suppliers } = useListSuppliers(companyId, {
    query: { enabled: !!companyId }
  });

  const createMutation = useCreateInvoice({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListInvoicesQueryKey(companyId) });
        setShowCreate(false);
        setForm(emptyForm);
        toast({ title: "Factura registrada", description: "La factura se ha guardado correctamente." });
      },
    },
  });

  const updateMutation = useUpdateInvoice({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListInvoicesQueryKey(companyId) });
        setEditInvoice(null);
        toast({ title: "Factura actualizada", description: "Los cambios se han guardado." });
      },
    },
  });

  const deleteMutation = useDeleteInvoice({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListInvoicesQueryKey(companyId) });
        setDeleteId(null);
        toast({ title: "Factura eliminada", description: "El registro ha sido eliminado." });
      },
    },
  });

  const handleSubmit = () => {
    if (!form.supplierId || !form.invoiceNumber || !form.amount) {
      toast({ title: "Faltan datos", description: "Completa los campos obligatorios.", variant: "destructive" });
      return;
    }
    const data = {
      supplierId: parseInt(form.supplierId),
      invoiceNumber: form.invoiceNumber,
      issueDate: form.issueDate,
      dueDate: form.dueDate || form.issueDate,
      amount: parseFloat(form.amount),
      currency: form.currency as any,
      status: form.status as any,
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

  const openEdit = (invoice: NonNullable<typeof invoices>[number]) => {
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
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Facturas</h1>
            <p className="text-muted-foreground mt-1 text-base">Control de cuentas por pagar y pagadas.</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setEditInvoice(null); setShowCreate(true); }} className="shadow-lg shadow-primary/20" data-testid="button-create-invoice">
            <Plus className="w-5 h-5 mr-2" /> Nueva Factura
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border/40 shadow-sm">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por N° factura o proveedor..."
              className="pl-9 h-10 bg-muted/50 border-border/50"
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-search-invoices"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 bg-muted/50 border-border/50" data-testid="select-status-filter">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="paid">Pagada</SelectItem>
              <SelectItem value="overdue">Vencida</SelectItem>
              <SelectItem value="scheduled">Programada</SelectItem>
              <SelectItem value="observed">Observada</SelectItem>
              <SelectItem value="cancelled">Anulada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent bg-muted/20">
                  <TableHead className="font-semibold text-muted-foreground h-12">N° Factura</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Proveedor</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Emisión</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Vencimiento</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Categoría</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Estado</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right">Monto</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="border-border/40">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j} className="py-4"><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !filteredInvoices?.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium text-foreground">No se encontraron facturas</p>
                        <p className="text-sm mt-1">Ajusta los filtros o registra una nueva factura.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map(inv => (
                    <TableRow key={inv.id} className="border-border/40 hover:bg-muted/30 transition-colors group" data-testid={`row-invoice-${inv.id}`}>
                      <TableCell className="font-mono text-sm font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell className="font-medium">{inv.supplierName}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{inv.issueDate}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{inv.dueDate}</TableCell>
                      <TableCell>
                        {inv.category ? (
                          <span className="text-xs font-medium px-2 py-1 rounded bg-secondary text-secondary-foreground">
                            {inv.category}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[inv.status] ?? ""}`}>
                          {statusLabels[inv.status] ?? inv.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {inv.currency} {Number(inv.amount).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => openEdit(inv)} className="cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteId(inv.id)} className="cursor-pointer text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreate || !!editInvoice} onOpenChange={open => { if (!open) { setShowCreate(false); setEditInvoice(null); } }}>
          <DialogContent className="sm:max-w-2xl bg-card border-border/40 shadow-2xl">
            <DialogHeader className="border-b border-border/40 pb-4">
              <DialogTitle className="text-xl">{editInvoice ? "Editar Factura" : "Registrar Nueva Factura"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
              <div className="md:col-span-2">
                <Label className="text-foreground/80 font-medium">Proveedor *</Label>
                <Select value={form.supplierId} onValueChange={v => setForm(f => ({ ...f, supplierId: v }))}>
                  <SelectTrigger className="mt-1.5 h-10" data-testid="select-invoice-supplier">
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
                <Label className="text-foreground/80 font-medium">N° de Factura *</Label>
                <Input value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} placeholder="E.g. F001-00045" className="mt-1.5 h-10" data-testid="input-invoice-number" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-foreground/80 font-medium">Monto *</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="mt-1.5 h-10" data-testid="input-invoice-amount" />
                </div>
                <div className="w-24">
                  <Label className="text-foreground/80 font-medium">Moneda</Label>
                  <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                    <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEN">PEN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Fecha de Emisión *</Label>
                <Input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} className="mt-1.5 h-10" data-testid="input-invoice-issue-date" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Fecha de Vencimiento</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="mt-1.5 h-10" data-testid="input-invoice-due-date" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Estado *</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1.5 h-10" data-testid="select-invoice-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="paid">Pagada</SelectItem>
                    <SelectItem value="overdue">Vencida</SelectItem>
                    <SelectItem value="scheduled">Programada</SelectItem>
                    <SelectItem value="observed">Observada</SelectItem>
                    <SelectItem value="cancelled">Anulada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Categoría</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ej. Servicios, Materiales" className="mt-1.5 h-10" data-testid="input-invoice-category" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-foreground/80 font-medium">Centro de Costos</Label>
                <Input value={form.costCenter} onChange={e => setForm(f => ({ ...f, costCenter: e.target.value }))} placeholder="Opcional" className="mt-1.5 h-10" data-testid="input-invoice-cost-center" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-foreground/80 font-medium">Observaciones Adicionales</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="mt-1.5 resize-none bg-muted/30" placeholder="Detalles extra sobre esta factura..." data-testid="textarea-invoice-notes" />
              </div>
            </div>
            <DialogFooter className="border-t border-border/40 pt-4">
              <Button variant="ghost" onClick={() => { setShowCreate(false); setEditInvoice(null); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="shadow-lg shadow-primary/20" data-testid="button-submit-invoice">
                {editInvoice ? "Guardar Cambios" : "Registrar Factura"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent className="bg-card border-border/40">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">¿Eliminar registro?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Estás a punto de eliminar esta factura permanentemente. Esta acción no se puede deshacer y los reportes financieros se actualizarán.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ companyId, invoiceId: deleteId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20">
                Sí, eliminar factura
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
