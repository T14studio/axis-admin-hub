import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ArrowLeft, Loader2, Save, Upload, Download, FileText, X, Check, ChevronsUpDown, Search, UserPlus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables as DBTables } from "@/integrations/supabase/types";

type ContractFile = DBTables<"contract_files">;

export default function ContractForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<DBTables<"clients">[]>([]);
  const [properties, setProperties] = useState<{ id: string; title: string; reference_code: string | null }[]>([]);
  const [files, setFiles] = useState<ContractFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const [isNewClient, setIsNewClient] = useState(false);
  const [isNewProperty, setIsNewProperty] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [propertySearchOpen, setPropertySearchOpen] = useState(false);

  const [form, setForm] = useState({
    contract_number: "", 
    client_id: "", 
    client_cpf: "", 
    client_name: "", 
    client_email: "",
    property_id: "" as string | null,
    new_property_title: "",
    new_property_ref: "",
    new_property_neighborhood: "",
    new_property_city: "",
    contract_type: "locacao", 
    start_date: "", 
    end_date: "",
    status: "pendente" as any, 
    value: "" as string | number, 
    notes: "", 
    pdf_url: "",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("clients").select("*").order("full_name"),
      supabase.from("properties").select("id, title, reference_code").order("title"),
    ]).then(([cRes, pRes]) => {
      setClients(cRes.data || []);
      setProperties(pRes.data || []);
    });
    if (!isNew && id) fetchContract(id);
  }, [id]);

  async function fetchContract(cid: string) {
    setLoading(true);
    const [cRes, fRes] = await Promise.all([
      supabase.from("contracts").select("*").eq("id", cid).single(),
      supabase.from("contract_files").select("*").eq("contract_id", cid),
    ]);
    if (cRes.data) {
      const d = cRes.data;
      setForm({
        contract_number: d.contract_number, 
        client_id: d.client_id, 
        client_cpf: d.client_cpf,
        client_name: "",
        client_email: "",
        property_id: d.property_id, 
        new_property_title: "",
        new_property_ref: "",
        new_property_neighborhood: "",
        new_property_city: "",
        contract_type: d.contract_type,
        start_date: d.start_date, 
        end_date: d.end_date || "",
        status: d.status, 
        value: d.value ?? "", 
        notes: d.notes || "", 
        pdf_url: d.pdf_url || "",
      });
    }
    setFiles(fRes.data || []);
    setLoading(false);
  }

  function onClientChange(clientId: string) {
    const client = clients.find((c) => c.id === clientId);
    setForm((f) => ({ 
      ...f, 
      client_id: clientId, 
      client_cpf: client?.cpf || "",
      client_name: client?.full_name || "",
      client_email: client?.email || ""
    }));
    setClientSearchOpen(false);
  }

  function onPropertyChange(propId: string) {
    setForm((f) => ({ ...f, property_id: propId }));
    setPropertySearchOpen(false);
  }

  async function handleSave() {
    if (!form.contract_number || (!form.client_id && !form.client_name) || !form.start_date || (!form.property_id && !form.new_property_title)) {
      toast.error("Preencha os campos obrigatórios (Número, Cliente, Imóvel e Data)"); return;
    }
    if (isNewClient && !form.client_email) {
      toast.error("E-mail é obrigatório para novos clientes"); return;
    }
    if (isNewProperty && !form.new_property_title) {
      toast.error("Título é obrigatório para o novo imóvel"); return;
    }
    setSaving(true);

    try {
      let clientId = form.client_id;

      // Create new client if needed
      if (isNewClient && form.client_name) {
        const normalizedCpf = form.client_cpf.replace(/\D/g, "");
        const { data: existingClient } = await supabase
          .from("clients")
          .select("id")
          .eq("cpf", normalizedCpf)
          .maybeSingle();

        if (existingClient) {
          clientId = existingClient.id;
          await supabase.from("clients").update({ email: form.client_email.toLowerCase().trim() }).eq("id", clientId);
        } else {
          const { data: newClient, error: clientErr } = await supabase
            .from("clients")
            .insert({
              full_name: form.client_name,
              cpf: normalizedCpf,
              email: form.client_email.toLowerCase().trim(),
            })
            .select()
            .single();
          
          if (clientErr) throw clientErr;
          clientId = newClient.id;
        }
      }

      let propertyId = form.property_id;

      // Create new property if needed
      if (isNewProperty && form.new_property_title) {
        const refCode = form.new_property_ref?.trim() || null;

        if (refCode) {
          const { data: existingProp } = await supabase
            .from("properties")
            .select("id")
            .eq("reference_code", refCode)
            .maybeSingle();
            
          if (existingProp) {
            toast.error(`O código de referência "${refCode}" já está em uso por outro imóvel.`);
            setSaving(false);
            return;
          }
        }

        const { data: newProp, error: propErr } = await supabase
          .from("properties")
          .insert({
            title: form.new_property_title,
            reference_code: refCode,
            neighborhood: form.new_property_neighborhood || null,
            city: form.new_property_city || null,
            status: "ativo",
            published: false,
          })
          .select()
          .single();
        
        if (propErr) {
          if (propErr.message?.includes('properties_reference_code_key')) {
            toast.error("O Código de Referência do imóvel já está em uso por outro imóvel.");
            setSaving(false);
            return;
          }
          throw propErr;
        }
        propertyId = newProp.id;
      }

      const payload = {
        contract_number: form.contract_number,
        client_id: clientId,
        client_cpf: form.client_cpf.replace(/\D/g, ""),
        property_id: propertyId || null,
        contract_type: form.contract_type,
        start_date: form.start_date,
        end_date: form.end_date || null,
        status: form.status,
        value: form.value ? Number(form.value) : null,
        notes: form.notes || "",
        pdf_url: form.pdf_url || "",
      };

      let contractId = id;

      if (isNew) {
        const { data, error } = await supabase.from("contracts").insert(payload).select().single();
        if (error) throw error;
        contractId = data.id;
        toast.success("Contrato criado");
      } else {
        const { error } = await supabase.from("contracts").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Contrato atualizado");
      }

      // Handle pending files
      if (pendingFiles.length > 0 && contractId) {
        setUploading(true);
        for (const file of pendingFiles) {
          const path = `${contractId}/${Date.now()}-${file.name}`;
          const { error: uploadErr } = await supabase.storage.from("contract-files").upload(path, file);
          if (uploadErr) { toast.error(`Erro ao subir ${file.name}: ${uploadErr.message}`); continue; }
          
          const { data: urlData } = supabase.storage.from("contract-files").getPublicUrl(path);
          await supabase.from("contract_files").insert({
            contract_id: contractId, file_url: urlData.publicUrl, file_name: file.name,
          });
        }
        setPendingFiles([]);
        setUploading(false);
      }

      if (isNew) navigate(`/admin/contracts/${contractId}`);
      else fetchContract(contractId!);
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const newFiles = Array.from(e.target.files);

    if (isNew) {
      setPendingFiles((prev) => [...prev, ...newFiles]);
      toast.info(`${newFiles.length} arquivo(s) selecionado(s). Salve para enviar.`);
      return;
    }

    setUploading(true);
    for (const file of newFiles) {
      const path = `${id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("contract-files").upload(path, file);
      if (error) { toast.error(error.message); continue; }
      const { data: urlData } = supabase.storage.from("contract-files").getPublicUrl(path);
      await supabase.from("contract_files").insert({
        contract_id: id!, file_url: urlData.publicUrl, file_name: file.name,
      });
    }
    const { data } = await supabase.from("contract_files").select("*").eq("contract_id", id!);
    setFiles(data || []);
    setUploading(false);
    toast.success("Arquivo(s) enviado(s)");
  }

  async function deleteFile(fid: string) {
    await supabase.from("contract_files").delete().eq("id", fid);
    setFiles((prev) => prev.filter((f) => f.id !== fid));
    toast.success("Arquivo removido");
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const selectedClient = clients.find(c => c.id === form.client_id);
  const selectedProperty = properties.find(p => p.id === form.property_id);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/contracts")}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-2xl font-bold text-foreground">{isNew ? "Novo Contrato" : "Editar Contrato"}</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin/contracts")}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar Contrato
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Informações Básicas</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nº do Contrato *</Label>
                <Input placeholder="Ex: 2024/001" value={form.contract_number} onChange={(e) => setForm({ ...form, contract_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Negócio</Label>
                <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="locacao">Locação</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="administracao">Administração</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                  <Input type="number" className="pl-9" placeholder="0,00" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status Atual</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                    <SelectItem value="vencendo">Vencendo</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Data Início *</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Data Término</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </CardContent>
          </Card>

          {/* Cliente Section */}
          <Card className={cn(isNewClient && "border-primary/50 bg-primary/5")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> Cliente / Proprietário</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setIsNewClient(!isNewClient); setForm({ ...form, client_id: "", client_name: "", client_cpf: "", client_email: "" }); }}>
                  {isNewClient ? "Voltar para busca" : "+ Novo Cliente"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isNewClient ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Buscar Cliente Existente</Label>
                  <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-12 border-primary/20 hover:border-primary/40 bg-background/50">
                        <div className="flex items-center gap-2 truncate">
                          <Search className="h-4 w-4 text-primary shrink-0" />
                          {selectedClient ? (
                            <span className="font-medium text-foreground">{selectedClient.full_name} <span className="text-muted-foreground font-normal ml-1">({selectedClient.cpf})</span></span>
                          ) : (
                            <span className="text-muted-foreground">Nome, CPF ou E-mail...</span>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0" align="start">
                      <Command className="rounded-lg border shadow-md">
                        <CommandInput placeholder="Digite para filtrar..." className="h-12" />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty className="py-6 text-center">
                            <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                            <Button variant="link" size="sm" className="mt-2 text-primary" onClick={() => { setIsNewClient(true); setClientSearchOpen(false); }}>Cadastrar como novo cliente</Button>
                          </CommandEmpty>
                          <CommandGroup heading="Clientes Cadastrados">
                            {clients.map((c) => (
                              <CommandItem key={c.id} value={`${c.full_name} ${c.cpf} ${c.email}`} onSelect={() => onClientChange(c.id)} className="flex items-center gap-3 p-3 cursor-pointer">
                                <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0", form.client_id === c.id && "bg-primary text-primary-foreground")}>
                                  {form.client_id === c.id ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                                </div>
                                <div className="flex flex-col flex-1 truncate">
                                  <span className="font-semibold text-sm leading-tight">{c.full_name}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase font-bold tracking-tighter">CPF: {c.cpf}</span>
                                    {c.email && <span className="text-[10px] text-primary/70 truncate lowercase">{c.email}</span>}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedClient && (
                    <div className="flex items-center gap-2 mt-3 animate-in fade-in zoom-in-95">
                      <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary py-1 px-2">
                        <Check className="h-3 w-3 mr-1" /> Cliente Selecionado
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => setForm(f => ({ ...f, client_id: "", client_cpf: "" }))}>Remover</Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2 col-span-full"><Label>Nome Completo *</Label><Input placeholder="Nome do cliente" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>CPF *</Label><Input placeholder="000.000.000-00" value={form.client_cpf} onChange={(e) => setForm({ ...form, client_cpf: e.target.value })} /></div>
                  <div className="space-y-2"><Label>E-mail *</Label><Input type="email" placeholder="email@exemplo.com" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} /></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Imovel Section */}
          <Card className={cn(isNewProperty && "border-primary/50 bg-primary/5")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Imóvel</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setIsNewProperty(!isNewProperty); setForm({ ...form, property_id: "", new_property_title: "", new_property_ref: "" }); }}>
                  {isNewProperty ? "Voltar para busca" : "+ Cadastrar Novo"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isNewProperty ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Vincular Imóvel Existente</Label>
                  <Popover open={propertySearchOpen} onOpenChange={setPropertySearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-12 border-primary/20 hover:border-primary/40 bg-background/50">
                        <div className="flex items-center gap-2 truncate">
                          <Search className="h-4 w-4 text-primary shrink-0" />
                          {selectedProperty ? (
                            <span className="font-medium text-foreground">{selectedProperty.title} <span className="text-muted-foreground font-normal ml-1">({selectedProperty.reference_code || "S/Ref"})</span></span>
                          ) : (
                            <span className="text-muted-foreground">Título ou Código do Imóvel...</span>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0" align="start">
                      <Command className="rounded-lg border shadow-md">
                        <CommandInput placeholder="Digite para filtrar..." className="h-12" />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">Nenhum imóvel encontrado.</CommandEmpty>
                          <CommandGroup heading="Imóveis Cadastrados">
                            {properties.map((p) => (
                              <CommandItem key={p.id} value={`${p.title} ${p.reference_code}`} onSelect={() => onPropertyChange(p.id)} className="flex items-center gap-3 p-3 cursor-pointer">
                                <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0", form.property_id === p.id && "bg-primary text-primary-foreground")}>
                                  {form.property_id === p.id ? <Check className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                                </div>
                                <div className="flex flex-col flex-1 truncate">
                                  <span className="font-semibold text-sm leading-tight">{p.title}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase font-bold tracking-tighter">REF: {p.reference_code || "-"}</span>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedProperty && (
                    <div className="flex items-center gap-2 mt-3 animate-in fade-in zoom-in-95">
                      <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary py-1 px-2">
                        <Check className="h-3 w-3 mr-1" /> Imóvel Vinculado
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => setForm(f => ({ ...f, property_id: "" }))}>Remover</Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2 col-span-full"><Label>Título do Imóvel *</Label><Input placeholder="Ex: Casa no Centro" value={form.new_property_title} onChange={(e) => setForm({ ...form, new_property_title: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Código Referência</Label><Input placeholder="Ex: CS-001" value={form.new_property_ref} onChange={(e) => setForm({ ...form, new_property_ref: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Bairro</Label><Input placeholder="Bairro" value={form.new_property_neighborhood} onChange={(e) => setForm({ ...form, new_property_neighborhood: e.target.value })} /></div>
                  <div className="space-y-2 col-span-full"><Label>Cidade</Label><Input placeholder="Cidade" value={form.new_property_city} onChange={(e) => setForm({ ...form, new_property_city: e.target.value })} /></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Observações Internas</CardTitle></CardHeader>
            <CardContent><Textarea placeholder="Notas adicionais sobre o contrato..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} /></CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Arquivos e Documentos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-4 text-center space-y-2">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                <p className="text-xs text-muted-foreground">Arraste ou selecione arquivos PDF</p>
                <label className="block">
                  <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  <Button variant="secondary" size="sm" asChild disabled={uploading} className="cursor-pointer">
                    <span>{uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />} Upload PDF</span>
                  </Button>
                </label>
              </div>

              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2 rounded border text-xs">
                    <span className="truncate flex-1 mr-2">{f.file_name}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                        <a href={f.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-3 w-3" /></a>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteFile(f.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded border border-dashed border-primary/50 bg-primary/5 text-xs">
                    <span className="truncate flex-1 mr-2">{file.name}</span>
                    <Badge variant="outline" className="text-[10px] py-0 h-4 px-1">Pendente</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-none">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dicas de Uso</CardTitle></CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>• Use o <strong>Novo Cliente</strong> para cadastrar rapidamente locatários ou proprietários.</p>
              <p>• O <strong>Cadastro Rápido de Imóvel</strong> permite criar o contrato sem que o imóvel esteja no site público.</p>
              <p>• CPFs e E-mails são validados para evitar duplicidade de cadastros.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
