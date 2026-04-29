import { z } from "zod";

export const PROPERTY_CATEGORIES = {
  RESIDENCIAL: [
    "Casa",
    "Apartamento",
    "Sobrado",
    "Loft",
    "Studio",
    "Kitnet",
    "Flat",
    "Duplex",
    "Triplex",
    "Cobertura",
    "Casa de Condomínio",
    "Mansão",
    "Edícula"
  ],
  COMERCIAL: [
    "Sala Comercial",
    "Loja",
    "Ponto Comercial",
    "Prédio Inteiro",
    "Escritório",
    "Consultório",
    "Salão de Festas",
    "Hotel",
    "Pousada",
    "Restaurante"
  ],
  RURAL: [
    "Fazenda",
    "Sítio",
    "Chácara",
    "Haras",
    "Rancho",
    "Área Rural",
    "Gleba"
  ],
  "INDUSTRIAL/LOGÍSTICO": [
    "Galpão",
    "Depósito",
    "Armazém",
    "Fábrica",
    "Porto Seco"
  ],
  TERRENOS: [
    "Lote Residencial",
    "Terreno Comercial",
    "Loteamento",
    "Área Industrial"
  ]
} as const;

export const ALL_PROPERTY_TYPES = [
  ...PROPERTY_CATEGORIES.RESIDENCIAL,
  ...PROPERTY_CATEGORIES.COMERCIAL,
  ...PROPERTY_CATEGORIES.RURAL,
  ...PROPERTY_CATEGORIES["INDUSTRIAL/LOGÍSTICO"],
  ...PROPERTY_CATEGORIES.TERRENOS
] as const;

export const propertyTypeSchema = z.enum(ALL_PROPERTY_TYPES as unknown as [string, ...string[]]);

export type PropertyType = z.infer<typeof propertyTypeSchema>;
