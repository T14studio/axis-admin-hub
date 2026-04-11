import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Save, Upload, X, Star } from "lucide-react";
import { toast } from "sonner";
import type { TablesInsert, Tables as DBTables } from "@/integrations/supabase/types";

type PropertyImage = DBTables<"property_images">;

const PURPOSES = ["venda", "aluguel", "venda_e_aluguel"];
const TYPES = ["apartamento", "casa", "terreno", "sala_comercial", "galpao", "cobertura", "flat", "chacara", "fazenda", "outro"];

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<TablesInsert<"properties">>({
    title: "", reference_code: "", purpose: "venda", property_type: "apartamento",
    description: "", price: null, condo_fee: null, iptu: null,
    neighborhood: "", city: "", state: "", address: "",
    bedrooms: 0, suites: 0, bathrooms: 0, parking_spots: 0,
    built_area: null, land_area: null, additional_features: "",
    status: "rascunho", featured: false, published: false, responsible: "",
  });

  useEffect(() => {
    if (!isNew && id) {
      fetchProperty(id);
    }
  }, [id]);

  async function fetchProperty(propId: string) {
    setLoading(true);
    const [propRes, imgRes] = await Promise.all([
      supabase.from("properties").select("*").eq("id", propId).single(),
      supabase.from("property_images").select("*").eq("property_id", propId).order("display_order"),
    ]);
    if (propRes.data) setForm(propRes.data);
    setImages(imgRes.data || []);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.title) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    if (isNew) {
      const { data, error } = await supabase.from("properties").insert(form).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Imóvel criado com sucesso");
      navigate(`/admin/properties/${data.id}`);
    } else {
      const { error } = await supabase.from("properties").update(form).eq("id", id);
      if (error) toast.error(error.message); else toast.success("Imóvel atualizado");
    }
    setSaving(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length || isNew) return;
    setUploading(true);
    for (const file of Array.from(e.target.files)) {
      const ext = file.name.split(".").pop();
      const path = `${id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("property-images").upload(path, file);
      if (uploadError) { toast.error(`Erro no upload: ${uploadError.message}`); continue; }
      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
      await supabase.from("property_images").insert({
        property_id: id!, image_url: urlData.publicUrl,
        is_main: images.length === 0, display_order: images.length,
      });
    }
    const { data: imgs } = await supabase.from("property_images").select("*").eq("property_id", id!).order("display_order");
    setImages(imgs || []);
    setUploading(false);
    toast.success("Imagens enviadas");
  }

  async function setMainImage(imgId: string) {
    await supabase.from("property_images").update({ is_main: false }).eq("property_id", id!);
    await supabase.from("property_images").update({ is_main: true }).eq("id", imgId);
    const { data } = await supabase.from("property_images").select("*").eq("property_id", id!).order("display_order");
    setImages(data || []);
    toast.success("Imagem principal definida");
  }

  async function deleteImage(imgId: string) {
    await supabase.from("property_images").delete().eq("id", imgId);
    setImages((prev) => prev.filter((i) => i.id !== imgId));
    toast.success("Imagem removida");
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/properties")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{isNew ? "Novo Imóvel" : "Editar Imóvel"}</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Informações Básicas</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 col-span-full">
            <Label>Título *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Código de Referência</Label>
            <Input value={form.reference_code || ""} onChange={(e) => set("reference_code", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Finalidade</Label>
            <Select value={form.purpose} onValueChange={(v) => set("purpose", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PURPOSES.map((p) => <SelectItem key={p} value={p}>{p.replace("_", " e ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.property_type} onValueChange={(v) => set("property_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status || "rascunho"} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-full space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={4} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Valores</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Preço (R$)</Label>
            <Input type="number" value={form.price ?? ""} onChange={(e) => set("price", e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div className="space-y-2">
            <Label>Condomínio (R$)</Label>
            <Input type="number" value={form.condo_fee ?? ""} onChange={(e) => set("condo_fee", e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div className="space-y-2">
            <Label>IPTU (R$)</Label>
            <Input type="number" value={form.iptu ?? ""} onChange={(e) => set("iptu", e.target.value ? Number(e.target.value) : null)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Localização</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 col-span-full"><Label>Endereço</Label><Input value={form.address || ""} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="space-y-2"><Label>Bairro</Label><Input value={form.neighborhood || ""} onChange={(e) => set("neighborhood", e.target.value)} /></div>
          <div className="space-y-2"><Label>Cidade</Label><Input value={form.city || ""} onChange={(e) => set("city", e.target.value)} /></div>
          <div className="space-y-2"><Label>Estado</Label><Input value={form.state || ""} onChange={(e) => set("state", e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Características</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>Quartos</Label><Input type="number" value={form.bedrooms ?? 0} onChange={(e) => set("bedrooms", Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Suítes</Label><Input type="number" value={form.suites ?? 0} onChange={(e) => set("suites", Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Banheiros</Label><Input type="number" value={form.bathrooms ?? 0} onChange={(e) => set("bathrooms", Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Vagas</Label><Input type="number" value={form.parking_spots ?? 0} onChange={(e) => set("parking_spots", Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Área Construída (m²)</Label><Input type="number" value={form.built_area ?? ""} onChange={(e) => set("built_area", e.target.value ? Number(e.target.value) : null)} /></div>
          <div className="space-y-2"><Label>Área Terreno (m²)</Label><Input type="number" value={form.land_area ?? ""} onChange={(e) => set("land_area", e.target.value ? Number(e.target.value) : null)} /></div>
          <div className="space-y-2 col-span-full"><Label>Características Adicionais</Label><Textarea value={form.additional_features || ""} onChange={(e) => set("additional_features", e.target.value)} rows={2} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Publicação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><Label>Publicar no site</Label><p className="text-xs text-muted-foreground">O imóvel ficará visível no site público</p></div>
            <Switch checked={form.published ?? false} onCheckedChange={(v) => set("published", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div><Label>Destaque</Label><p className="text-xs text-muted-foreground">Destacar na página principal</p></div>
            <Switch checked={form.featured ?? false} onCheckedChange={(v) => set("featured", v)} />
          </div>
          <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsible || ""} onChange={(e) => set("responsible", e.target.value)} /></div>
        </CardContent>
      </Card>

      {!isNew && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Fotos</CardTitle>
              <label className="cursor-pointer">
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />} Enviar fotos</span>
                </Button>
              </label>
            </div>
          </CardHeader>
          <CardContent>
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma foto enviada</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border">
                    <img src={img.image_url} alt="" className="w-full h-32 object-cover" />
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => setMainImage(img.id)} title="Definir como principal">
                        <Star className={`h-3 w-3 ${img.is_main ? "fill-warning text-warning" : ""}`} />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => deleteImage(img.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {img.is_main && <Badge className="absolute bottom-1 left-1 text-xs bg-warning text-warning-foreground">Principal</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => navigate("/admin/properties")}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}
