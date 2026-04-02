import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useCompany } from "@/context/CompanyContext";
import {
  useListAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  useMarkAnnouncementRead,
  getListAnnouncementsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, Trash2, Edit, Megaphone, Bell, Users, Eye } from "lucide-react";

const priorityColors: Record<string, string> = {
  urgent: "bg-destructive/15 text-destructive border-destructive/20",
  high: "bg-orange-500/15 text-orange-500 border-orange-500/20",
  medium: "bg-blue-500/15 text-blue-500 border-blue-500/20",
  low: "bg-muted text-muted-foreground border-border",
};

const priorityLabels: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta Prioridad",
  medium: "Normal",
  low: "Informativo",
};

interface AnnForm {
  title: string;
  content: string;
  priority: string;
  targetType: string;
  targetValue: string;
}

const emptyForm: AnnForm = { title: "", content: "", priority: "medium", targetType: "all", targetValue: "" };

export default function Announcements() {
  const { companyId } = useCompany();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<AnnForm>(emptyForm);

  const { data: announcements, isLoading } = useListAnnouncements(companyId, {
    query: { enabled: !!companyId, queryKey: getListAnnouncementsQueryKey(companyId) }
  });

  const filteredAnnouncements = announcements?.filter(a => priorityFilter === "all" ? true : a.priority === priorityFilter);

  const createMutation = useCreateAnnouncement({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey(companyId) });
        setShowCreate(false);
        setForm(emptyForm);
        toast({ title: "Comunicado emitido", description: "El mensaje ha sido publicado exitosamente." });
      },
    },
  });

  const updateMutation = useUpdateAnnouncement({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey(companyId) });
        setEditId(null);
        toast({ title: "Comunicado actualizado" });
      },
    },
  });

  const deleteMutation = useDeleteAnnouncement({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey(companyId) });
        setDeleteId(null);
        toast({ title: "Comunicado borrado" });
      },
    },
  });

  const markReadMutation = useMarkAnnouncementRead({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey(companyId) });
      },
    },
  });

  const handleSubmit = () => {
    if (!form.title || !form.content) {
      toast({ title: "Información incompleta", description: "El título y mensaje son obligatorios.", variant: "destructive" });
      return;
    }
    const data = { title: form.title, content: form.content, priority: form.priority as any, targetType: form.targetType as any, targetValue: form.targetValue || undefined };
    if (editId) {
      updateMutation.mutate({ companyId, announcementId: editId, data });
    } else {
      createMutation.mutate({ companyId, data });
    }
  };

  const openEdit = (ann: NonNullable<typeof announcements>[number]) => {
    setForm({ title: ann.title, content: ann.content, priority: ann.priority, targetType: ann.targetType, targetValue: ann.targetValue ?? "" });
    setEditId(ann.id);
  };

  const unread = announcements?.filter(a => !a.isRead).length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              Comunicados Internos
              {unread > 0 && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold shadow-sm">{unread} Nuevos</span>}
            </h1>
            <p className="text-muted-foreground mt-1 text-base">Boletín informativo y notificaciones corporativas.</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setShowCreate(true); }} className="shadow-lg shadow-primary/20" data-testid="button-create-announcement">
            <Megaphone className="w-5 h-5 mr-2" /> Emitir Comunicado
          </Button>
        </div>

        <div className="flex items-center">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[200px] h-10 bg-card border-border/50" data-testid="select-priority-filter">
              <SelectValue placeholder="Filtrar por prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta Prioridad</SelectItem>
              <SelectItem value="medium">Normal</SelectItem>
              <SelectItem value="low">Informativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : !filteredAnnouncements?.length ? (
          <div className="flex flex-col items-center justify-center p-16 bg-card border border-border/40 rounded-xl text-center shadow-sm">
            <Bell className="w-16 h-16 text-muted-foreground/20 mb-4" />
            <p className="text-xl font-semibold text-foreground">Bandeja Vacía</p>
            <p className="text-muted-foreground mt-2 max-w-md">No hay comunicados activos en este momento que coincidan con tus filtros.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map(ann => (
              <div key={ann.id} className={`rounded-xl border p-6 transition-all relative overflow-hidden shadow-sm ${ann.isRead ? "border-border/40 bg-card hover:bg-card/80" : "border-primary/40 bg-primary/5 shadow-primary/5"}`} data-testid={`card-announcement-${ann.id}`}>
                {!ann.isRead && <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>}
                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${priorityColors[ann.priority] ?? ""}`}>
                        {priorityLabels[ann.priority] ?? ann.priority}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground flex items-center bg-muted px-2 py-0.5 rounded">
                        <Users className="w-3 h-3 mr-1" />
                        {ann.targetType === "all" ? "Toda la empresa" : ann.targetType === "area" ? `Área: ${ann.targetValue}` : ann.targetValue ?? ann.targetType}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground leading-tight mt-1">{ann.title}</h3>
                    <p className="text-base text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">{ann.content}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center"><span className="text-foreground/50 mr-1.5 border-r border-border/50 pr-1.5">Emitido por</span> {ann.publishedBy}</span>
                      <span className="flex items-center"><span className="text-foreground/50 mr-1.5 border-r border-border/50 pr-1.5">Fecha</span> {new Date(ann.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}</span>
                      <span className="flex items-center"><Eye className="w-3.5 h-3.5 mr-1" /> {ann.readCount} vistas</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    {!ann.isRead && (
                      <Button variant="outline" size="sm" className="w-full bg-background border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => markReadMutation.mutate({ companyId, announcementId: ann.id })} data-testid={`button-mark-read-${ann.id}`}>
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Marcar Leído
                      </Button>
                    )}
                    <div className="flex gap-1 w-full justify-end mt-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => openEdit(ann)} data-testid={`button-edit-ann-${ann.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(ann.id)} data-testid={`button-delete-ann-${ann.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showCreate || !!editId} onOpenChange={open => { if (!open) { setShowCreate(false); setEditId(null); } }}>
          <DialogContent className="sm:max-w-xl bg-card border-border/40 shadow-2xl">
            <DialogHeader className="border-b border-border/40 pb-4">
              <DialogTitle className="text-xl flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" />
                {editId ? "Modificar Comunicado" : "Emitir Nuevo Comunicado"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-foreground/80 font-medium">Asunto del Mensaje *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1.5 h-10 text-base" placeholder="Ej. Actualización de Políticas" data-testid="input-ann-title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground/80 font-medium">Nivel de Prioridad</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger className="mt-1.5 h-10" data-testid="select-ann-priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Informativo</SelectItem>
                      <SelectItem value="medium">Normal</SelectItem>
                      <SelectItem value="high">Alta Prioridad</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground/80 font-medium">Alcance del Mensaje</Label>
                  <Select value={form.targetType} onValueChange={v => setForm(f => ({ ...f, targetType: v }))}>
                    <SelectTrigger className="mt-1.5 h-10" data-testid="select-ann-target"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toda la empresa</SelectItem>
                      <SelectItem value="area">Área específica</SelectItem>
                      <SelectItem value="site">Sede específica</SelectItem>
                      <SelectItem value="individual">Usuario individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.targetType !== "all" && (
                <div>
                  <Label className="text-foreground/80 font-medium">Especificar Destino *</Label>
                  <Input value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} placeholder={`Escribe el nombre del ${form.targetType === 'area' ? 'área' : form.targetType === 'site' ? 'sede' : 'usuario'}...`} className="mt-1.5 h-10" data-testid="input-ann-target-value" />
                </div>
              )}
              <div>
                <Label className="text-foreground/80 font-medium">Cuerpo del Mensaje *</Label>
                <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} className="mt-1.5 resize-y bg-background text-base" placeholder="Redacta la información a comunicar..." data-testid="textarea-ann-content" />
              </div>
            </div>
            <DialogFooter className="border-t border-border/40 pt-4">
              <Button variant="ghost" onClick={() => { setShowCreate(false); setEditId(null); }}>Descartar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="shadow-lg shadow-primary/20" data-testid="button-submit-announcement">
                {editId ? "Guardar Cambios" : "Publicar Ahora"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent className="bg-card border-border/40">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">¿Retirar comunicado?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Esta acción eliminará el mensaje del muro corporativo de todos los usuarios de forma permanente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ companyId, announcementId: deleteId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20">Sí, retirar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
