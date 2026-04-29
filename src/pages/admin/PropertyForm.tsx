import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2, Save, Upload, X, Star, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { TablesInsert, Tables as DBTables } from "@/integrations/supabase/types";
import { PROPERTY_CATEGORIES } from "@/types/property";

type PropertyImage = DBTables<"property_images">;

const PURPOSES = ["venda", "locação", "venda_e_locação"];
const PROXIMITY_ITEMS = [
  "Centro Comercial", "Ciclovia", "Clube", "Conveniência", "Correio", "Delegacia",
  "Escola Estadual", "Escola Municipal", "Escola Particular", "Faculdade", "Farmácia", "Feira",
  "Hospital", "Igreja", "Lotérica", "Mercado", "Padaria", "Parque",
  "Pista de Caminhada", "Posto Policial", "Postos de Saúde", "Praça", "Shopping", "Supermercado",
  "Teatro", "Terminal Rodoviário", "Universidade"
];

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<any>({
    title: "", reference_code: "", purpose: "venda", property_type: "apartamento",
    features: "", price: null, condo_fee: null, iptu: null,
    neighborhood: "", city: "", state: "", address: "", cep: "",
    built_area: null, total_area: null,
    observations: "", proximity: [], condition: "usado",
    highlight: [], expiration_date: "", is_reserved: false,
    broker_name: "", status: "ativo", published: true,
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
    if (propRes.data) {
      setForm({
        ...propRes.data,
        proximity: propRes.data.proximity || [],
        highlight: propRes.data.highlight || [],
      });
    }
    setImages(imgRes.data || []);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.title) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    
    // Clean up data for Supabase
    const payload = { ...form };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    // Convert empty strings to null for database fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === "") {
        payload[key] = null;
      }
    });

    delete payload.cep;

    if (isNew) {
      const { data, error } = await supabase.from("properties").insert(payload).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Imóvel criado com sucesso. Agora você pode adicionar imagens.");
      navigate(`/admin/properties/${data.id}`);
    } else {
      const { error } = await supabase.from("properties").update(payload).eq("id", id);
      if (error) toast.error(error.message); else toast.success("Imóvel atualizado");
    }
    setSaving(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !id || id === "new") return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Erro ao subir imagem: ${uploadError.message}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("property-images")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("property_images").insert({
        property_id: id,
        image_url: publicUrl,
        display_order: images.length,
        is_main: images.length === 0, // Primeira imagem vira capa automaticamente
      });

      if (dbError) toast.error(dbError.message);
    }
    
    fetchProperty(id);
    setUploading(false);
  }

  async function handleRemoveImage(imgId: string, imageUrl: string) {
    if (!window.confirm("Deseja excluir esta imagem?")) return;
    
    // Extrair o path do Storage da URL pública
    const path = imageUrl.split("/").slice(-2).join("/"); // Formato id/filename.ext
    
    await supabase.storage.from("property-images").remove([path]);
    const { error } = await supabase.from("property_images").delete().eq("id", imgId);
    
    if (error) toast.error(error.message);
    else {
      toast.success("Imagem removida");
      setImages(images.filter(img => img.id !== imgId));
    }
  }

  async function handleSetMainImage(imgId: string) {
    if (!id || id === "new") return;
    
    // Reset all
    await supabase.from("property_images").update({ is_main: false }).eq("property_id", id);
    // Set new main
    const { error } = await supabase.from("property_images").update({ is_main: true }).eq("id", imgId);
    
    if (error) toast.error(error.message);
    else {
      setImages(images.map(img => ({ ...img, is_main: img.id === imgId })));
      toast.success("Imagem de capa atualizada");
    }
  }

  async function handleCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    
    // Formatar como 00000-000
    const formatted = value.replace(/^(\d{5})(\d)/, "$1-$2");
    set("cep", formatted);

    if (value.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setForm((prev: any) => ({
            ...prev,
            cep: formatted,
            state: data.uf || prev.state,
            city: data.localidade || prev.city,
            neighborhood: data.bairro || prev.neighborhood,
            address: data.logradouro ? `${data.logradouro}, ` : prev.address
          }));
          toast.success("Endereço preenchido via CEP!");
        } else {
          toast.error("CEP não encontrado.");
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
        toast.error("Erro ao buscar CEP.");
      }
    }
  }

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const toggleProximity = (item: string) => {
    const current = [...(form.proximity || [])];
    const index = current.indexOf(item);
    if (index > -1) current.splice(index, 1);
    else current.push(item);
    set("proximity", current);
  };

  const toggleHighlight = (item: string) => {
    const current = [...(form.highlight || [])];
    const index = current.indexOf(item);
    if (index > -1) current.splice(index, 1);
    else current.push(item);
    set("highlight", current);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/properties")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{isNew ? "Novo imóvel" : "Editar imóvel"}</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin/properties")}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Condicao */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Condição*</Label>
                <RadioGroup value={form.condition} onValueChange={(v) => set("condition", v)} className="flex gap-8">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="novo" id="novo" className="text-primary border-primary" />
                    <Label htmlFor="novo" className="font-semibold cursor-pointer">Imóvel NOVO</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="usado" id="usado" className="text-primary border-primary" />
                    <Label htmlFor="usado" className="font-semibold cursor-pointer">Imóvel USADO</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Finalidade e Tipo */}
          <Card>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Finalidade*</Label>
                <Select value={form.purpose} onValueChange={(v) => set("purpose", v)}>
                  <SelectTrigger><SelectValue placeholder="Finalidade" /></SelectTrigger>
                  <SelectContent>
                    {PURPOSES.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Tipo de imóvel*</Label>
                <Select value={form.property_type} onValueChange={(v) => set("property_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROPERTY_CATEGORIES).map(([category, types]) => (
                      <SelectGroup key={category}>
                        <SelectLabel>{category}</SelectLabel>
                        {types.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Localizacao */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={form.cep || ""} onChange={handleCepChange} placeholder="00000-000" maxLength={9} />
                </div>
                <div className="space-y-2">
                  <Label>Estado*</Label>
                  <Input value={form.state || ""} onChange={(e) => set("state", e.target.value)} placeholder="Estado" />
                </div>
                <div className="space-y-2">
                  <Label>Cidade*</Label>
                  <Input value={form.city || ""} onChange={(e) => set("city", e.target.value)} placeholder="Cidade" />
                </div>
                <div className="space-y-2">
                  <Label>Bairro*</Label>
                  <Input value={form.neighborhood || ""} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Bairro" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <div className="flex gap-2">
                  <Input value={form.address || ""} onChange={(e) => set("address", e.target.value)} className="flex-1" />
                  <Button variant="secondary" className="bg-cyan-500 hover:bg-cyan-600 text-white shrink-0">
                    <MapPin className="h-4 w-4 mr-2" /> Posicionar no mapa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Titulo e Areas */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Área construída / útil</Label>
                  <div className="relative">
                    <Input type="number" value={form.built_area ?? ""} onChange={(e) => set("built_area", e.target.value ? Number(e.target.value) : null)} />
                    <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">m²</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Área total</Label>
                  <div className="relative">
                    <Input type="number" value={form.total_area ?? ""} onChange={(e) => set("total_area", e.target.value ? Number(e.target.value) : null)} />
                    <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">m²</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Imagens */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Imagens do Imóvel</CardTitle>
                <p className="text-[11px] text-muted-foreground">A primeira imagem será a capa por padrão.</p>
              </div>
              <div>
                <Input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isNew || uploading}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById("image-upload")?.click()}
                  disabled={isNew || uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  {isNew ? "Salve para subir fotos" : "Adicionar Fotos"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {images.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg py-12 flex flex-col items-center justify-center text-muted-foreground">
                  <Upload className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">{isNew ? "Salve o imóvel primeiro" : "Nenhuma imagem adicionada"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((img) => (
                    <div key={img.id} className="group relative aspect-square rounded-md overflow-hidden bg-muted">
                      <img src={img.image_url} alt="Property" className="h-full w-full object-cover" />
                      
                      {/* Overlay Controls */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant={img.is_main ? "default" : "secondary"}
                          className="h-8 w-8 rounded-full"
                          title="Definir como capa"
                          onClick={() => handleSetMainImage(img.id)}
                        >
                          <Star className={`h-4 w-4 ${img.is_main ? "fill-yellow-400 text-yellow-400" : ""}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8 rounded-full"
                          title="Remover imagem"
                          onClick={() => handleRemoveImage(img.id, img.image_url)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {img.is_main && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">CAPA</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Textareas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Mais características</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={form.features || ""} onChange={(e) => set("features", e.target.value)} rows={4} maxLength={700} />
                <p className="text-[10px] text-muted-foreground mt-1">No máximo 700 caracteres.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Observações</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={form.observations || ""} onChange={(e) => set("observations", e.target.value)} rows={4} maxLength={300} />
                <p className="text-[10px] text-muted-foreground mt-1">No máximo 300 caracteres.</p>
              </CardContent>
            </Card>
          </div>

          {/* Proximidades */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Tem nas proximidades</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {PROXIMITY_ITEMS.map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox id={item} checked={form.proximity?.includes(item)} onCheckedChange={() => toggleProximity(item)} />
                    <Label htmlFor={item} className="text-[11px] leading-tight cursor-pointer font-normal">{item}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>IPTU</Label>
                <Input type="number" value={form.iptu ?? ""} onChange={(e) => set("iptu", e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div className="space-y-2">
                <Label>Condomínio</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                  <Input type="number" value={form.condo_fee ?? ""} onChange={(e) => set("condo_fee", e.target.value ? Number(e.target.value) : null)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor do imóvel*</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                  <Input type="number" value={form.price ?? ""} onChange={(e) => set("price", e.target.value ? Number(e.target.value) : null)} className="pl-9" />
                </div>
                <p className="text-[10px] text-muted-foreground">Informe o valor total do imóvel para venda ou locação.</p>
              </div>
            </CardContent>
          </Card>

          {/* Corretor */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Corretor para atendimento</CardTitle></CardHeader>
            <CardContent>
              <Input value={form.broker_name || ""} onChange={(e) => set("broker_name", e.target.value)} placeholder="Nome do corretor..." />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label>Data expiração</Label>
                <Input type="date" value={form.expiration_date || ""} onChange={(e) => set("expiration_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={form.reference_code || ""} onChange={(e) => set("reference_code", e.target.value)} />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Reservado?</Label>
                <RadioGroup value={form.is_reserved ? "sim" : "nao"} onValueChange={(v) => set("is_reserved", v === "sim")} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="res-sim" />
                    <Label htmlFor="res-sim" className="font-normal cursor-pointer">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="res-nao" />
                    <Label htmlFor="res-nao" className="font-normal cursor-pointer">Não</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Destaque</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {["Capa", "Lista", "Lançamento"].map(item => (
                <div key={item} className="flex items-center space-x-2">
                  <Checkbox id={`dest-${item}`} checked={form.highlight?.includes(item)} onCheckedChange={() => toggleHighlight(item)} />
                  <Label htmlFor={`dest-${item}`} className="font-normal cursor-pointer text-sm">{item}</Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Published toggle */}
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <Label>Publicado</Label>
              <Switch checked={form.published} onCheckedChange={(v) => set("published", v)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
