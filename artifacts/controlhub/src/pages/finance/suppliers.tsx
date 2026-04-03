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
import { Plus, Search, Trash2, Edit, Building2, MoreHorizontal, Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

  const { data: suppliers, isLoading } = useListSuppliers(companyId, undefined, { 
    query: { enabled: !!companyId, queryKey: getListSuppliersQueryKey(companyId) }
  });

  const filteredSuppliers = suppliers?.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.ruc?.includes(q) || s.tradeName?.toLowerCase().includes(q);
  });

  const createMutation = useCreateSupplier({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSuppliersQueryKey(companyId) });
        setShowCreate(false);
        setForm(emptyForm);
        toast({ title: "Proveedor registrado", description: "El proveedor se añadió al directorio." });
      },
    },
  });

  const updateMutation = useUpdateSupplier({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSuppliersQueryKey(companyId) });
        setEditSupplier(null);
        toast({ title: "Proveedor actualizado", description: "Los datos han sido guardados." });
      },
    },
  });

  const deleteMutation = useDeleteSupplier({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSuppliersQueryKey(companyId) });
        setDeleteId(null);
        toast({ title: "Proveedor eliminado", description: "El registro ha sido removido." });
      },
    },
  });

  const handleSubmit = () => {
    if (!form.name) {
      toast({ title: "Faltan datos", description: "El nombre o razón social es obligatorio.", variant: "destructive" });
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

  const openEdit = (s: NonNullable<typeof suppliers>[number]) => {
    setForm({ 
      name: s.name, 
      tradeName: s.tradeName ?? "", 
      ruc: s.ruc ?? "", 
      contactName: s.contactName ?? "", 
      email: s.email ?? "", 
      phone: s.phone ?? "", 
      address: s.address ?? "", 
      notes: s.notes ?? "" 
    });
    setEditSupplier({ id: s.id });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Directorio de Proveedores</h1>
            <p className="text-muted-foreground mt-1 text-base">Administra información fiscal y de contacto de tus proveedores.</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setEditSupplier(null); setShowCreate(true); }} className="shadow-lg shadow-primary/20" data-testid="button-create-supplier">
            <Plus className="w-5 h-5 mr-2" /> Nuevo Proveedor
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border/40 shadow-sm">
          <div className="relative flex-1 w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por razón social o RUC..." 
              className="pl-9 h-10 bg-muted/50 border-border/50" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              data-testid="input-search-suppliers" 
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 rounded-xl border border-border/40 bg-card shadow-sm">
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-6" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))
          ) : !filteredSuppliers?.length ? (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-center p-8 bg-card rounded-xl border border-border/40">
              <Building2 className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium text-foreground">No hay proveedores en el directorio</p>
              <p className="text-sm text-muted-foreground mt-1">Registra tu primer proveedor para asociarlo a las facturas.</p>
            </div>
          ) : (
            filteredSuppliers.map(s => (
              <div key={s.id} className="rounded-xl border border-border/40 bg-card hover:bg-card/80 transition-colors shadow-sm group flex flex-col" data-testid={`card-supplier-${s.id}`}>
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-lg leading-tight text-foreground">{s.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{s.tradeName || "Sin nombre comercial"}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openEdit(s)} className="cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteId(s.id)} className="cursor-pointer text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center text-sm">
                      <span className="w-12 text-muted-foreground text-xs uppercase tracking-wider font-semibold">RUC</span>
                      <span className="font-mono text-foreground bg-muted px-2 py-0.5 rounded text-xs">{s.ruc || "No registrado"}</span>
                    </div>
                    
                    {(s.email || s.phone) && (
                      <div className="pt-3 border-t border-border/40 space-y-2 mt-3">
                        {s.email && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="w-4 h-4 mr-2.5 shrink-0" />
                            <span className="truncate">{s.email}</span>
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="w-4 h-4 mr-2.5 shrink-0" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="px-5 py-3 border-t border-border/40 bg-muted/10 flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Facturas</span>
                    <span className="text-sm font-medium">{s.invoiceCount}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Facturado</span>
                    <span className="text-sm font-bold text-primary">S/ {Number(s.totalBilled).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreate || !!editSupplier} onOpenChange={open => { if (!open) { setShowCreate(false); setEditSupplier(null); } }}>
          <DialogContent className="sm:max-w-2xl bg-card border-border/40 shadow-2xl">
            <DialogHeader className="border-b border-border/40 pb-4">
              <DialogTitle className="text-xl">{editSupplier ? "Editar Proveedor" : "Registrar Proveedor"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
              <div className="md:col-span-2">
                <Label className="text-foreground/80 font-medium">Razón Social *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1.5 h-10" data-testid="input-supplier-name" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Nombre Comercial</Label>
                <Input value={form.tradeName} onChange={e => setForm(f => ({ ...f, tradeName: e.target.value }))} className="mt-1.5 h-10" placeholder="Si es diferente a la razón social" data-testid="input-supplier-trade-name" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">RUC</Label>
                <Input value={form.ruc} onChange={e => setForm(f => ({ ...f, ruc: e.target.value }))} className="mt-1.5 h-10 font-mono" placeholder="20000000000" data-testid="input-supplier-ruc" />
              </div>
              <div className="md:col-span-2 pt-2 pb-1">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-2">Datos de Contacto</h4>
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Nombre del Contacto</Label>
                <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} className="mt-1.5 h-10" placeholder="Ej. Juan Pérez" data-testid="input-supplier-contact" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1.5 h-10" placeholder="contacto@empresa.com" data-testid="input-supplier-email" />
              </div>
              <div>
                <Label className="text-foreground/80 font-medium">Teléfono</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1.5 h-10" data-testid="input-supplier-phone" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-foreground/80 font-medium">Dirección Fiscal</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="mt-1.5 h-10" data-testid="input-supplier-address" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-foreground/80 font-medium">Notas u Observaciones</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="mt-1.5 resize-none bg-muted/30" data-testid="textarea-supplier-notes" />
              </div>
            </div>
            <DialogFooter className="border-t border-border/40 pt-4">
              <Button variant="ghost" onClick={() => { setShowCreate(false); setEditSupplier(null); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="shadow-lg shadow-primary/20" data-testid="button-submit-supplier">
                {editSupplier ? "Guardar Cambios" : "Guardar Proveedor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent className="bg-card border-border/40">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">¿Eliminar proveedor?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Estás a punto de eliminar este proveedor permanentemente. Las facturas asociadas mantendrán el registro del nombre, pero se perderá la ficha de contacto.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ companyId, supplierId: deleteId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20">
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
