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
import { ArrowLeft, Loader2, Save, Upload, Download, FileText, X } from "lucide-react";
import { toast } from "sonner";
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    contract_number: "", client_id: "", client_cpf: "", client_name: "", property_id: "" as string | null,
    contract_type: "locacao", start_date: "", end_date: "",
    status: "pendente" as any, value: "" as string | number, notes: "", pdf_url: "",
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
        contract_number: d.contract_number, client_id: d.client_id, client_cpf: d.client_cpf,
        property_id: d.property_id, contract_type: d.contract_type,
        start_date: d.start_date, end_date: d.end_date || "",
        status: d.status, value: d.value ?? "", notes: d.notes || "", pdf_url: d.pdf_url || "",
      });
    }
    setFiles(fRes.data || []);
    setLoading(false);
  }

  function onClientChange(clientId: string) {
    const client = clients.find((c) => c.id === clientId);
    setForm((f) => ({ ...f, client_id: clientId, client_cpf: client?.cpf || "" }));
  }

  async function handleSave() {
    if (!form.contract_number || (!form.client_id && !form.client_name) || !form.start_date) {
      toast.error("Preencha os campos obrigatórios"); return;
    }
    setSaving(true);

    try {
      let clientId = form.client_id;

      // Create new client if needed
      if (isNewClient && form.client_name) {
        const { data: newClient, error: clientErr } = await supabase
          .from("clients")
          .insert({
            full_name: form.client_name,
            cpf: form.client_cpf,
          })
          .select()
          .single();
        
        if (clientErr) throw clientErr;
        clientId = newClient.id;
      }

      const payload = {
        contract_number: form.contract_number,
        client_id: clientId,
        client_cpf: form.client_cpf,
        property_id: form.property_id || null,
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

      if (isNew) {
        navigate(`/admin/contracts/${contractId}`);
      } else {
        fetchContract(contractId!);
      }
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
      toast.info(`${newFiles.length} arquivo(s) selecionado(s). Salve o contrato para concluir o envio.`);
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

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/contracts")}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-2xl font-bold text-foreground">{isNew ? "Novo Contrato" : "Editar Contrato"}</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Dados do Contrato</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nº Contrato *</Label><Input value={form.contract_number} onChange={(e) => setForm({ ...form, contract_number: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Tipo</Label>
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
            <div className="flex items-center justify-between">
              <Label>Cliente *</Label>
              <Button 
                variant="link" 
                className="h-auto p-0 text-xs" 
                type="button"
                onClick={() => {
                  setIsNewClient(!isNewClient);
                  setForm({ ...form, client_id: "", client_name: "", client_cpf: "" });
                }}
              >
                {isNewClient ? "Selecionar Existente" : "Novo Cliente"}
              </Button>
            </div>
            {isNewClient ? (
              <Input 
                placeholder="Nome completo do cliente" 
                value={form.client_name} 
                onChange={(e) => setForm({ ...form, client_name: e.target.value })} 
              />
            ) : (
              <Select value={form.client_id} onValueChange={onClientChange}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name} - {c.cpf}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>CPF do Cliente *</Label>
            <Input 
              value={form.client_cpf} 
              onChange={(e) => setForm({ ...form, client_cpf: e.target.value })} 
              readOnly={!isNewClient}
              className={!isNewClient ? "bg-muted" : ""}
              placeholder="000.000.000-00"
            />
          </div>
          <div className="space-y-2">
            <Label>Imóvel</Label>
            <Select value={form.property_id || ""} onValueChange={(v) => setForm({ ...form, property_id: v || null })}>
              <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>
                {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.title} {p.reference_code ? `(${p.reference_code})` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
          <div className="space-y-2"><Label>Data Início *</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
          <div className="space-y-2"><Label>Data Término</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Status</Label>
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
          <div className="col-span-full space-y-2"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Arquivos PDF (Contrato)</CardTitle>
            <label className="cursor-pointer">
              <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              <Button variant="outline" size="sm" asChild disabled={uploading}>
                <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />} Selecionar PDF</span>
              </Button>
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 && pendingFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum arquivo selecionado</p>
          ) : (
            <div className="space-y-2">
              {/* Existing Files */}
              {files.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{f.file_name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                      <a href={f.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteFile(f.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {/* Pending Files */}
              {pendingFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-dashed border-primary/50 bg-primary/5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <Badge variant="outline" className="text-[10px] py-0 h-4">Pendente</Badge>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => navigate("/admin/contracts")}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}
