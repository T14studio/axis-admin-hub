import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Loader2, Eye } from "lucide-react";
import { format } from "date-fns";
import type { Tables as DBTables } from "@/integrations/supabase/types";
import { PROPERTY_CATEGORIES } from "@/types/property";

type Property = DBTables<"properties">;

export default function PropertiesPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => { fetchProperties(); }, []);

  async function fetchProperties() {
    setLoading(true);
    const { data } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
    setProperties(data || []);
    setLoading(false);
  }

  const filtered = properties.filter((p) => {
    const match = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.reference_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.neighborhood || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchType = typeFilter === "all" || p.property_type === typeFilter;
    return match && matchStatus && matchType;
  });

  const formatPrice = (v: number | null) => v ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-";

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Imóveis</h1>
        <Button onClick={() => navigate("/admin/properties/new")}><Plus className="h-4 w-4 mr-1" /> Novo Imóvel</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por título, código ou bairro..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Tipo de imóvel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum imóvel encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead className="hidden md:table-cell">Código</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="hidden md:table-cell">Bairro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Publicado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/properties/${p.id}`)}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{p.reference_code || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={p.condition === "novo" ? "border-primary text-primary" : "text-muted-foreground"}>
                          {p.condition === "novo" ? "Novo" : "Usado"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(p.price)}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{p.neighborhood || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={p.status === "ativo" ? "bg-success/10 text-success" : p.status === "rascunho" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {p.published ? <Badge variant="secondary" className="bg-success/10 text-success">Sim</Badge> : <Badge variant="secondary">Não</Badge>}
                      </TableCell>
                      <TableCell><Eye className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
