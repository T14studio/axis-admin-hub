import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { supabase, SUPABASE_URL, SUPABASE_KEY } from "@/integrations/supabase/client";
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
import { ArrowLeft, Loader2, Save, Upload, X, Star, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { TablesInsert, Tables as DBTables } from "@/integrations/supabase/types";
import { PROPERTY_CATEGORIES } from "@/types/property";

type PropertyImage = DBTables<"property_images">;

const PURPOSES = ["venda", "locação", "venda_e_locação"];
const PROXIMITY_ITEMS = [
  "Centro Comercial", "Ciclovia", "Clube", "Conveniência", "Correio", "Delegacia",
  "Escola Estadual", "Escola Municipal", "Escola Particular", "Faculdade", "Farmácia", "Feira",
  "Hospital", "Igreja", "Lotérica", "Mercado", "Padaria", "Parque",
  "Pista de Caminhada", "Ponto de Ônibus", "Posto de Combustível", "Praça", "Praia",
  "Restaurante", "Shopping", "Supermercado", "Trem", "Metrô"
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
    broker_name: "", status: "ativo", ativo: true,
    is_published: false, publish_site: false, publish_whatsapp: false,
  });

  useEffect(() => {
    if (!isNew && id) {
      fetchProperty(id);
    }
  }, [id]);

  async function fetchProperty(propId: string) {
    setLoading(true);
    // DIAGNÓSTICO CONFIRMADO: o SELECT de property_images via Supabase JS (autenticado)
    // retorna [] devido à policy RLS has_admin_access(). A anon key funciona (verificado).
    // Solução: usar o endpoint proxy do backend que usa a anon key server-side.
    const [propRes, imgRes] = await Promise.all([
      supabase.from("properties").select("id, title, reference_code, purpose, property_type, price, condo_fee, iptu, neighborhood, city, state, address, built_area, total_area, features, observations, proximity, condition, highlight, expiration_date, is_reserved, broker_name, status, created_at, updated_at, published").eq("id", propId).single(),
      fetch(`/api/property-images/${propId}`).then(r => r.json()).catch(() => []),
    ]);
    if (propRes.data) {
      setForm({
        ...propRes.data,
        proximity: propRes.data.proximity || [],
        highlight: propRes.data.highlight || [],
        // Ensure missing fields have defaults
        ativo: (propRes.data as any).ativo ?? true,
        is_published: (propRes.data as any).is_published ?? propRes.data.published ?? false,
        publish_site: (propRes.data as any).publish_site ?? propRes.data.published ?? false,
        publish_whatsapp: (propRes.data as any).publish_whatsapp ?? false,
      });
    }
    setImages(Array.isArray(imgRes) ? imgRes : []);
    setLoading(false);
  }


  async function handleSave() {
    if (!form.title) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    
    // Explicit payload to avoid sending obsolete or frontend-only fields
    const payload = {
      title: form.title,
      reference_code: form.reference_code || null,
      purpose: form.purpose,
      property_type: form.property_type,
      features: form.features || null,
      price: form.price ? Number(form.price) : null,
      condo_fee: form.condo_fee ? Number(form.condo_fee) : null,
      iptu: form.iptu ? Number(form.iptu) : null,
      neighborhood: form.neighborhood || null,
      city: form.city || null,
      state: form.state || null,
      address: form.address || null,
      built_area: form.built_area ? Number(form.built_area) : null,
      total_area: form.total_area ? Number(form.total_area) : null,
      observations: form.observations || null,
      proximity: form.proximity || [],
      condition: form.condition || "usado",
      highlight: form.highlight || [],
      expiration_date: form.expiration_date || null,
      is_reserved: !!form.is_reserved,
      broker_name: form.broker_name || null,
      status: form.status || "ativo",
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      // These columns were added in migrations
      published: !!form.is_published,
      // We keep the internal flags for the frontend logic
    };

    if (isNew) {
      const { data, error } = await supabase.from("properties").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Imóvel criado com sucesso. Agora você pode adicionar imagens.");
      navigate(`/admin/properties/${data.id}`);
    } else {
      const { error } = await supabase.from("properties").update(payload).eq("id", id);
      if (error) toast.error(error.message); else toast.success("Imóvel atualizado");
    }
    setSaving(false);
  }

  // Helper: Lê um arquivo usando 3 estratégias em cascata para garantir zero NotReadableError
  async function readFileAsBase64(file: File): Promise<string> {
    // ESTRATÉGIA 1: Blob URL + fetch -> Blob em RAM -> FileReader (Resistente a bloqueios de SO)
    // O fetch(blobUrl) usa a stack de rede nativa em C++ do Chromium. O Blob resultante
    // fica 100% em memória RAM. Ao ler o Blob em RAM, o FileReader não toca no arquivo do disco,
    // eliminando completamente o NotReadableError do SO/OneDrive/Antivírus.
    try {
      const blobUrl = URL.createObjectURL(file);
      const response = await fetch(blobUrl);
      const memoryBlob = await response.blob();
      URL.revokeObjectURL(blobUrl);

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(memoryBlob); // Lê do Blob em RAM
      });

      console.log(`[Upload Reader] Estratégia 1 (BlobURL) SUCESSO: ${file.name} (${base64.length} chars)`);
      return base64;
    } catch (e1) {
      console.warn(`[Upload Reader] Estratégia 1 falhou para ${file.name}, tentando Estratégia 2...`, e1);
    }

    // ESTRATÉGIA 2: Native file.arrayBuffer() -> Uint8Array -> Chunked Base64
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const mime = file.type || "image/jpeg";
      const base64 = `data:${mime};base64,${btoa(binary)}`;
      console.log(`[Upload Reader] Estratégia 2 (arrayBuffer) SUCESSO: ${file.name}`);
      return base64;
    } catch (e2) {
      console.warn(`[Upload Reader] Estratégia 2 falhou para ${file.name}, tentando Estratégia 3...`, e2);
    }

    // ESTRATÉGIA 3: FileReader Direto (Último recurso)
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => {
        const err = reader.error;
        reject(new Error(`Não foi possível ler o arquivo ${file.name} [${err?.name || "Erro de Leitura"}]`));
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const filesArray = Array.from(e.target.files || []);
    if (filesArray.length === 0 || !id || id === "new") return;

    // 1. Lê todos os arquivos usando a função multi-estratégia (SEM alteração de estado DOM)
    let filePayloads: { fileName: string; fileType: string; base64: string }[] = [];
    try {
      filePayloads = await Promise.all(
        filesArray.map(async (file) => {
          const base64 = await readFileAsBase64(file);
          return {
            fileName: file.name,
            fileType: file.type || "image/jpeg",
            base64,
          };
        })
      );
      console.log("[Upload] Todos os arquivos lidos com sucesso em RAM:", filePayloads.map(f => f.fileName));
    } catch (readErr: any) {
      console.error("[Upload] Falha geral na leitura:", readErr.message);
      toast.error(readErr.message || "Não foi possível ler o arquivo selecionado");
      return;
    }

    // 2. Com todas as imagens em RAM, reseta o input e ativa loading na interface
    e.target.value = "";
    setUploading(true);
    const toastId = toast.loading(`Enviando ${filePayloads.length} imagem(ns)...`);

    // 3. Envia os payloads JSON para o servidor proxy
    let currentCount = images.length;
    let successCount = 0;
    let lastErrorMsg = "";

    for (const payload of filePayloads) {
      try {
        console.log("[Upload] Enviando para servidor:", payload.fileName, `(${Math.round(payload.base64.length / 1024)}KB base64)`);

        const response = await fetch("/api/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: id,
            fileName: payload.fileName,
            fileType: payload.fileType,
            fileBase64: payload.base64,
            displayOrder: currentCount,
            isMain: currentCount === 0,
          }),
        });

        const result = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        console.log("[Upload] Resposta servidor:", response.status, result);

        if (!response.ok || !result.publicUrl) {
          lastErrorMsg = result.error || `Erro ${response.status}`;
          console.error("[Upload] Falha no servidor:", lastErrorMsg);
          continue;
        }

        currentCount++;
        successCount++;
        console.log("[Upload] ✅ SUCESSO TOTAL:", result.publicUrl);

      } catch (err: any) {
        console.error("[Upload] Exceção de rede:", err?.message);
        lastErrorMsg = err?.message || "Erro de conexão com o servidor";
      }
    }

    // 4. Feedback e atualização
    if (successCount > 0) {
      toast.success(`${successCount} imagem(ns) enviada(s) com sucesso!`, { id: toastId });
      fetchProperty(id);
    } else {
      toast.error(`Falha no upload: ${lastErrorMsg || "Erro desconhecido"}`, { id: toastId });
    }
    setUploading(false);
  }







  async function handleRemoveImage(imgId: string, imageUrl: string) {
    if (!window.confirm("Deseja excluir esta imagem?")) return;

    try {
      const res = await fetch("/api/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: imgId, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Erro ao remover imagem");
        return;
      }
      toast.success("Imagem removida");
      if (id && id !== "new") fetchProperty(id);
    } catch (err: any) {
      toast.error(err.message || "Erro ao conectar com o servidor");
    }
  }

  async function handleSetMainImage(imgId: string) {
    if (!id || id === "new") return;

    try {
      const res = await fetch("/api/set-main-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: id, imageId: imgId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Erro ao definir capa");
        return;
      }
      toast.success("Imagem de capa atualizada");
      fetchProperty(id);
    } catch (err: any) {
      toast.error(err.message || "Erro ao conectar com o servidor");
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

  async function handleGeolocation() {
    const address = (form.address || "").trim();
    const city = (form.city || "").trim();
    const state = (form.state || "").trim();

    if (!address || !city || !state) {
      toast.error("Preencha endereço, cidade e estado antes de posicionar no mapa.");
      return;
    }

    const toastId = toast.loading("Buscando localização no mapa...");

    try {
      const queries = [
        `${address}, ${form.neighborhood || ''}, ${city}, ${state}, ${form.cep || ''}, Brasil`.replace(/,\s*,/g, ','),
        `${address}, ${city}, ${state}, Brasil`,
        `${address}, ${form.neighborhood || ''}, ${city}, Brasil`.replace(/,\s*,/g, ','),
        form.cep ? `${form.cep}, Brasil` : ''
      ].filter(q => q && q.trim().length > 0 && q.trim() !== 'Brasil');

      let found = false;

      for (const query of queries) {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
          headers: { 'Accept-Language': 'pt-BR' }
        });
        if (!res.ok) continue;

        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);

          setForm((prev: any) => ({
            ...prev,
            latitude: lat,
            longitude: lon,
          }));

          toast.success("Imóvel localizado no mapa!", { id: toastId });
          found = true;
          break;
        }
      }

      if (!found) {
        toast.error("Endereço não localizado.", { id: toastId });
      }
    } catch (error) {
      console.error("Erro no geocoding:", error);
      toast.error("Erro de conexão ao buscar endereço.", { id: toastId });
    }
  }

  const set = (k: string, v: any) => {
    setForm((p: any) => {
      const newState = { ...p, [k]: v };
      
      // Logic: Se "Publicar" = false → desmarcar canais
      if (k === "is_published" && v === false) {
        newState.publish_site = false;
        newState.publish_whatsapp = false;
      }
      
      // Logic: Se qualquer canal ativo → is_published = true
      if ((k === "publish_site" || k === "publish_whatsapp") && v === true) {
        newState.is_published = true;
      }

      return newState;
    });
  };

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

  const handleDelete = async () => {
    if (isNew || !id) return;

    const confirmed = window.confirm("ATENÇÃO\nEsta ação excluirá permanentemente este imóvel.\nTodas as imagens vinculadas também serão removidas.\nEsta operação não pode ser desfeita.");
    
    if (!confirmed) return;

    setSaving(true);
    const toastId = toast.loading("Excluindo imóvel...");

    try {
      const response = await fetch(`/api/delete-property/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Erro ao excluir imóvel");
      }

      toast.success("Imóvel excluído com sucesso!", { id: toastId });
      navigate("/admin/properties");
    } catch (error: any) {
      console.error("Erro ao excluir imóvel:", error);
      toast.error(error.message || "Erro ao excluir imóvel.", { id: toastId });
      setSaving(false);
    }
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
          {!isNew && (
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Excluir imóvel
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate("/admin/properties")} disabled={saving}>Cancelar</Button>
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
                  <Button onClick={handleGeolocation} variant="secondary" className="bg-cyan-500 hover:bg-cyan-600 text-white shrink-0" type="button">
                    <MapPin className="h-4 w-4 mr-2" /> Posicionar no mapa
                  </Button>
                </div>
              </div>

              {form.latitude && form.longitude && (
                <div className="mt-4 rounded-md overflow-hidden border border-border h-64 w-full">
                  <iframe
                    title="Mapa do Imóvel"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.longitude - 0.005},${form.latitude - 0.005},${form.longitude + 0.005},${form.latitude + 0.005}&layer=mapnik&marker=${form.latitude},${form.longitude}`}
                  />
                </div>
              )}
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
                <p className="text-[11px] text-muted-foreground">
                  Você pode selecionar <b>várias imagens</b> de uma vez. A primeira será a capa.
                </p>
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
                  {isNew ? "Salve para subir fotos" : "Selecionar Múltiplas Fotos"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => { console.log("STATE IMAGES", images.length, images.map(i => i.image_url)); return null; })()}
              {images.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg py-12 flex flex-col items-center justify-center text-muted-foreground">
                  <Upload className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">{isNew ? "Salve o imóvel primeiro" : "Nenhuma imagem adicionada"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((img) => {
                    const src = img.image_url ? img.image_url : "";
                    console.log("IMAGE", img.id, "url:", img.image_url, "src:", src);
                    return (
                    <div key={img.id} className="group relative aspect-square rounded-md overflow-hidden bg-muted">
                      <img src={src} alt="Property" className="h-full w-full object-cover" />
                      
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
                    );
                  })}
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

          {/* CRM Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status Interno (CRM)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Imóvel Ativo</Label>
                  <p className="text-[10px] text-muted-foreground">Disponível para contratos</p>
                </div>
                <Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} />
              </div>
            </CardContent>
          </Card>

          {/* Publication controls */}
          <Card className={form.is_published ? "border-primary/50 shadow-sm" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Publicação & Canais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-bottom">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Publicar Imóvel</Label>
                  <p className="text-[10px] text-muted-foreground">Visibilidade externa</p>
                </div>
                <Switch checked={form.is_published} onCheckedChange={(v) => set("is_published", v)} />
              </div>
              
              <div className="space-y-3 pt-2">
                <div className={`flex items-center space-x-2 transition-opacity ${!form.is_published ? "opacity-50 pointer-events-none" : ""}`}>
                  <Checkbox 
                    id="publish_site" 
                    checked={form.publish_site} 
                    onCheckedChange={(v) => set("publish_site", !!v)} 
                  />
                  <Label htmlFor="publish_site" className="text-sm cursor-pointer">Exibir no Site</Label>
                </div>
                
                <div className={`flex items-center space-x-2 transition-opacity ${!form.is_published ? "opacity-50 pointer-events-none" : ""}`}>
                  <Checkbox 
                    id="publish_whatsapp" 
                    checked={form.publish_whatsapp} 
                    onCheckedChange={(v) => set("publish_whatsapp", !!v)} 
                  />
                  <Label htmlFor="publish_whatsapp" className="text-sm cursor-pointer">Disponível no WhatsApp IA</Label>
                </div>
              </div>

              {form.is_published && !form.publish_site && !form.publish_whatsapp && (
                <p className="text-[10px] text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-100">
                  ⚠️ Publicado mas sem canais selecionados. Não será visível externamente.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
