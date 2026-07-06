import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { TablePagination } from "@/components/admin/TablePagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pill, Pencil, Trash2, Archive, RotateCcw, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string; name: string; product_type: string; description: string | null; unit: string; created_at: string;
}

const typeLabel: Record<string, string> = { vacina: "Vacina", soro: "Soro", reagente: "Reagente" };

export default function Produtos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Product | null>(null);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [productType, setProductType] = useState("");
  const [unit, setUnit] = useState("dose");
  const [description, setDescription] = useState("");
  const [tab, setTab] = useState("active");
  const { toast } = useToast();
  const pagActive = useClientPagination(products);
  const pagArchived = useClientPagination(archivedProducts);

  const fetchProducts = async () => {
    const [{ data: active }, { data: archived }] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("name"),
      supabase.from("products").select("*").eq("is_active", false).order("name"),
    ]);
    setProducts((active as Product[]) ?? []);
    setArchivedProducts((archived as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const resetForm = () => { setName(""); setProductType(""); setUnit("dose"); setDescription(""); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("products").insert({ name, product_type: productType, unit, description: description || null } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Produto registado com sucesso" }); setOpen(false); resetForm(); fetchProducts();
  };

  const openEdit = (p: Product) => {
    setEditItem(p); setName(p.name); setProductType(p.product_type); setUnit(p.unit); setDescription(p.description || ""); setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const { error } = await supabase.from("products").update({ name, product_type: productType, unit, description: description || null } as any).eq("id", editItem.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Produto actualizado" }); setEditOpen(false); setEditItem(null); resetForm(); fetchProducts();
  };

  const handleRestore = async (id: string) => {
    const { error } = await supabase.from("products").update({ is_active: true } as any).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Produto restaurado com sucesso" }); fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("products").update({ is_active: false } as any).eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Produto arquivado com sucesso" }); setDeleteId(null); fetchProducts();
  };

  const formFields = (
    <>
      <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Vacina contra Raiva" required /></div>
      <div><Label>Tipo</Label>
        <Select value={productType} onValueChange={setProductType} required>
          <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="vacina">Vacina</SelectItem><SelectItem value="soro">Soro</SelectItem><SelectItem value="reagente">Reagente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>Unidade</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ex: dose, ml, unidade" required /></div>
      <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do produto" /></div>
    </>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Pill} title="Produtos" description="Catálogo de vacinas, soros e reagentes">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Produto</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Registar Produto</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">{formFields}<Button type="submit" className="w-full" disabled={!productType}>Registar</Button></form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditItem(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Editar Produto</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">{formFields}<Button type="submit" className="w-full" disabled={!productType}>Guardar Alterações</Button></form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} title="Arquivar Produto" description="O produto será arquivado e deixará de aparecer na listagem, mas os lotes associados serão mantidos." />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Detalhes do Produto</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Nome:</span><p className="font-medium">{viewItem.name}</p></div>
                <div><span className="text-muted-foreground">Tipo:</span><p className="font-medium">{typeLabel[viewItem.product_type] || viewItem.product_type}</p></div>
                <div><span className="text-muted-foreground">Unidade:</span><p className="font-medium">{viewItem.unit}</p></div>
                <div><span className="text-muted-foreground">Criado em:</span><p className="font-medium">{new Date(viewItem.created_at).toLocaleDateString("pt-AO")}</p></div>
              </div>
              {viewItem.description && <div><span className="text-muted-foreground">Descrição:</span><p className="font-medium mt-1">{viewItem.description}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Activos ({products.length})</TabsTrigger>
          <TabsTrigger value="archived"><Archive className="mr-1 h-4 w-4" />Arquivados ({archivedProducts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <AdminCard title="Produtos Cadastrados" icon={Pill} loading={loading} isEmpty={products.length === 0} emptyMessage="Nenhum produto registado.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Unidade</TableHead><TableHead>Descrição</TableHead><TableHead className="w-24">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagActive.pageItems.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium"><div className="flex items-center gap-2"><Pill className="h-4 w-4 text-primary" />{p.name}</div></TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{typeLabel[p.product_type] || p.product_type}</Badge></TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{p.description || "—"}</TableCell>
                    <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setViewItem(p)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={pagActive.page} pageSize={pagActive.pageSize} total={pagActive.total} totalPages={pagActive.totalPages}
              canPrev={pagActive.canPrev} canNext={pagActive.canNext}
              onPageChange={pagActive.setPage} onPageSizeChange={pagActive.setPageSize}
            />
          </AdminCard>
        </TabsContent>

        <TabsContent value="archived">
          <AdminCard title="Produtos Arquivados" icon={Archive} loading={loading} isEmpty={archivedProducts.length === 0} emptyMessage="Nenhum produto arquivado.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Unidade</TableHead><TableHead>Descrição</TableHead><TableHead className="w-24">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagArchived.pageItems.map((p) => (
                  <TableRow key={p.id} className="opacity-70">
                    <TableCell className="font-medium"><div className="flex items-center gap-2"><Pill className="h-4 w-4 text-muted-foreground" />{p.name}</div></TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{typeLabel[p.product_type] || p.product_type}</Badge></TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{p.description || "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-primary" onClick={() => handleRestore(p.id)}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={pagArchived.page} pageSize={pagArchived.pageSize} total={pagArchived.total} totalPages={pagArchived.totalPages}
              canPrev={pagArchived.canPrev} canNext={pagArchived.canNext}
              onPageChange={pagArchived.setPage} onPageSizeChange={pagArchived.setPageSize}
            />
          </AdminCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}