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
import { Plus, CheckCircle, Trash2, Edit, Megaphone } from "lucide-react";

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500/15 text-red-400 border-red-500/20",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  medium: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  low: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

const priorityLabels: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baja",
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
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
  });

  const createMutation = useCreateAnnouncement({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey(companyId) });
        setShowCreate(false);
        setForm(emptyForm);
        toast({ title: "Comunicado publicado" });
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
        toast({ title: "Comunicado eliminado" });
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
      toast({ title: "Titulo y contenido son requeridos", variant: "destructive" });
      return;
    }
    const data = { title: form.title, content: form.content, priority: form.priority, targetType: form.targetType, targetValue: form.targetValue || undefined };
    if (editId) {
      updateMutation.mutate({ companyId, announcementId: editId, data });
    } else {
      createMutation.mutate({ companyId, data });
    }
  };

  const openEdit = (ann: typeof announcements extends Array<infer T> ? T : never) => {
    setForm({ title: ann.title, content: ann.content, priority: ann.priority, targetType: ann.targetType, targetValue: ann.targetValue ?? "" });
    setEditId(ann.id);
  };

  const unread = announcements?.filter(a => !a.isRead).length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Comunicados</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Muro de avisos y comunicados internos
              {unread > 0 && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{unread} sin leer</span>}
            </p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setShowCreate(true); }} data-testid="button-create-announcement">
            <Plus className="w-4 h-4 mr-2" /> Publicar Comunicado
          </Button>
        </div>

        <div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-44" data-testid="select-priority-filter">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
          </div>
        ) : !announcements?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No hay comunicados publicados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map(ann => (
              <div key={ann.id} className={`rounded-lg border p-5 transition-colors group ${ann.isRead ? "border-border/40 bg-card/30" : "border-primary/20 bg-card/60"}`} data-testid={`card-announcement-${ann.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[ann.priority] ?? ""}`}>
                        {priorityLabels[ann.priority] ?? ann.priority}
                      </span>
                      {!ann.isRead && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                      <span className="text-xs text-muted-foreground">Para: {ann.targetType === "all" ? "Todos" : ann.targetValue ?? ann.targetType}</span>
                    </div>
                    <h3 className="font-semibold mt-2">{ann.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{ann.content}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span>{ann.publishedBy}</span>
                      <span>&middot;</span>
                      <span>{new Date(ann.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      <span>&middot;</span>
                      <span>{ann.readCount} leido(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!ann.isRead && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:text-green-400" onClick={() => markReadMutation.mutate({ companyId, announcementId: ann.id })} data-testid={`button-mark-read-${ann.id}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(ann)} data-testid={`button-edit-ann-${ann.id}`}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(ann.id)} data-testid={`button-delete-ann-${ann.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showCreate || !!editId} onOpenChange={open => { if (!open) { setShowCreate(false); setEditId(null); } }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Comunicado" : "Publicar Comunicado"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Titulo *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} data-testid="input-ann-title" />
              </div>
              <div>
                <Label>Contenido *</Label>
                <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} data-testid="textarea-ann-content" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prioridad</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger data-testid="select-ann-priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Destinatarios</Label>
                  <Select value={form.targetType} onValueChange={v => setForm(f => ({ ...f, targetType: v }))}>
                    <SelectTrigger data-testid="select-ann-target"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="area">Por area</SelectItem>
                      <SelectItem value="site">Por sede</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.targetType !== "all" && (
                <div>
                  <Label>Valor destino</Label>
                  <Input value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} placeholder="Area, sede o nombre..." data-testid="input-ann-target-value" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); setEditId(null); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-announcement">
                {editId ? "Guardar" : "Publicar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar comunicado</AlertDialogTitle>
              <AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ companyId, announcementId: deleteId })} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
