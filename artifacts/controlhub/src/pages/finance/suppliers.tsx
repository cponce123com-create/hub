import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useCompany } from "@/context/CompanyContext";
import {
  useListSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  getListSuppliersQueryKey,
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
import { Plus, Search, Trash2, Edit, Building2 } from "lucide-react";

interface SupplierForm {
  name: string;
  tradeName: string;
  ruc: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

const emptyForm: SupplierForm = { name: "", tradeName: "", ruc: "", contactName: "", email: "", phone: "", address: "", notes: "" };

export default function Suppliers() {
  const { companyId } = useCompany();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editSupplier, setEditSupplier] = useState<{ id: number } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);

  const { data: suppliers, isLoading } = useListSuppliers(companyId, { search: search || undefined });

  const createMutation = useCreateSupplier({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSuppliersQueryKey(companyId) });
        setShowCreate(false);
        setForm(emptyForm);
        toast({ title: "Proveedor creado" });
      },
    },
  });

  const updateMutation = useUpdateSupplier({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSuppliersQueryKey(companyId) });
        setEditSupplier(null);
        toast({ title: "Proveedor actualizado" });
      },
    },
  });

  const deleteMutation = useDeleteSupplier({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSuppliersQueryKey(companyId) });
        setDeleteId(null);
        toast({ title: "Proveedor eliminado" });
      },
    },
  });

  const handleSubmit = () => {
    if (!form.name) {
      toast({ title: "El nombre es requerido", variant: "destructive" });
      return;
    }
    const data = {
      name: form.name,
      tradeName: form.tradeName || undefined,
      ruc: form.ruc || undefined,
      contactName: form.contactName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      notes: form.notes || undefined,
    };
    if (editSupplier) {
      updateMutation.mutate({ companyId, supplierId: editSupplier.id, data });
    } else {
      createMutation.mutate({ companyId, data });
    }
  };

  const openEdit = (s: typeof suppliers extends Array<infer T> ? T : never) => {
    setForm({ name: s.name, tradeName: s.tradeName ?? "", ruc: s.ruc ?? "", contactName: s.contactName ?? "", email: s.email ?? "", phone: s.phone ?? "", address: s.address ?? "", notes: s.notes ?? "" });
    setEditSupplier({ id: s.id });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
            <p className="text-muted-foreground text-sm mt-1">Administra tus proveedores y su historial</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setEditSupplier(null); setShowCreate(true); }} data-testid="button-create-supplier">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Proveedor
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar proveedores..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-suppliers" />
        </div>

        <div className="rounded-lg border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Nombre</TableHead>
                <TableHead className="text-muted-foreground font-medium">RUC</TableHead>
                <TableHead className="text-muted-foreground font-medium">Contacto</TableHead>
                <TableHead className="text-muted-foreground font-medium">Email</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Facturas</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Total Facturado</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-border/60">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !suppliers?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No hay proveedores registrados</p>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map(s => (
                  <TableRow key={s.id} className="border-border/60" data-testid={`row-supplier-${s.id}`}>
                    <TableCell>
                      <div className="font-medium">{s.name}</div>
                      {s.tradeName && <div className="text-xs text-muted-foreground">{s.tradeName}</div>}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{s.ruc ?? "-"}</TableCell>
                    <TableCell className="text-sm">{s.contactName ?? "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.email ?? "-"}</TableCell>
                    <TableCell className="text-right font-semibold">{s.invoiceCount}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      S/ {Number(s.totalBilled).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)} data-testid={`button-edit-supplier-${s.id}`}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)} data-testid={`button-delete-supplier-${s.id}`}>
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

        <Dialog open={showCreate || !!editSupplier} onOpenChange={open => { if (!open) { setShowCreate(false); setEditSupplier(null); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} data-testid="input-supplier-name" />
              </div>
              <div>
                <Label>Nombre comercial</Label>
                <Input value={form.tradeName} onChange={e => setForm(f => ({ ...f, tradeName: e.target.value }))} data-testid="input-supplier-trade-name" />
              </div>
              <div>
                <Label>RUC</Label>
                <Input value={form.ruc} onChange={e => setForm(f => ({ ...f, ruc: e.target.value }))} data-testid="input-supplier-ruc" />
              </div>
              <div>
                <Label>Contacto</Label>
                <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} data-testid="input-supplier-contact" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} data-testid="input-supplier-email" />
              </div>
              <div>
                <Label>Telefono</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} data-testid="input-supplier-phone" />
              </div>
              <div>
                <Label>Direccion</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} data-testid="input-supplier-address" />
              </div>
              <div className="col-span-2">
                <Label>Observaciones</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} data-testid="textarea-supplier-notes" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); setEditSupplier(null); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-supplier">
                {editSupplier ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar proveedor</AlertDialogTitle>
              <AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ companyId, supplierId: deleteId })} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
