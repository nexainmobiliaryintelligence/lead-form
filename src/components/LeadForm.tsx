import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const leadSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  email: z.string().trim().email("Email no válido").max(255),
  telefono: z.string().trim().min(6, "Teléfono no válido").max(20),
  interes: z.enum(["comprar", "alquilar"], { required_error: "Selecciona una opción" }),
  urgencia: z.enum(["inmediata", "1-3_meses", "3-6_meses", "solo_explorando"], {
    required_error: "Selecciona la urgencia",
  }),
});

type LeadData = z.infer<typeof leadSchema>;

const WEBHOOK_URL = "https://dariikk.app.n8n.cloud/webhook/leads_form";
const CALENDLY_URL = "https://calendly.com/darikrodriguez-07/30min";

const urgenciaLabels: Record<string, string> = {
  inmediata: "Inmediata",
  "1-3_meses": "1-3 meses",
  "3-6_meses": "3-6 meses",
  solo_explorando: "Solo explorando",
};

export default function LeadForm() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadData, string>>>({});
  const [originUrl, setOriginUrl] = useState("");

  const [form, setForm] = useState<LeadData>({
    nombre: "",
    email: "",
    telefono: "",
    interes: "comprar",
    urgencia: "1-3_meses",
  });

  useEffect(() => {
    const source =
      searchParams.get("utm_source") ||
      searchParams.get("ref") ||
      searchParams.get("source") ||
      document.referrer ||
      "directo";
    setOriginUrl(source);
  }, [searchParams]);

  const handleChange = (field: keyof LeadData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validación (igual que antes)
  const result = leadSchema.safeParse(form);
  if (!result.success) {
    // ... errores igual ...
    return;
  }

  setSubmitting(true);
  
  const payload = {
    ...result.data,
    origen: originUrl,
    timestamp: new Date().toISOString(),
    landing_url: window.location.href,
  };

  // 🔥 ENVÍA Y SIGUE (no espera respuesta)
  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true  // Envía aunque cambies página
  }).catch(err => {
    console.error("n8n:", err); // Solo log, no bloquea
  });

  // ✅ AVANZA INMEDIATAMENTE
  setSubmitted(true);
  toast({ 
    title: "¡Enviado correctamente!", 
    description: "Nos contactamos pronto." 
  });
  
  setTimeout(() => {
    window.location.href = CALENDLY_URL;
  }, 1000);
  
  setSubmitting(false);
};

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-2 mx-auto">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-foreground">¡Gracias por tu interés!</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Hemos recibido tu información. Un asesor se pondrá en contacto contigo a la mayor brevedad.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nombre */}
      <div className="space-y-1.5">
        <Label htmlFor="nombre" className="text-sm font-medium text-foreground">Nombre completo</Label>
        <Input
          id="nombre"
          value={form.nombre}
          onChange={(e) => handleChange("nombre", e.target.value)}
          placeholder="Tu nombre"
          className={errors.nombre ? "border-destructive" : ""}
        />
        {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="tu@email.com"
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      {/* Teléfono */}
      <div className="space-y-1.5">
        <Label htmlFor="telefono" className="text-sm font-medium text-foreground">Teléfono</Label>
        <Input
          id="telefono"
          type="tel"
          value={form.telefono}
          onChange={(e) => handleChange("telefono", e.target.value)}
          placeholder="+34 600 000 000"
          className={errors.telefono ? "border-destructive" : ""}
        />
        {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
      </div>

      {/* Interés */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">¿Qué te interesa?</Label>
        <div className="flex gap-3">
          {(["comprar", "alquilar"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleChange("interes", opt)}
              className={`flex-1 py-2.5 px-4 rounded-md border text-sm font-medium transition-colors ${
                form.interes === opt
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-secondary"
              }`}
            >
              {opt === "comprar" ? "Comprar" : "Alquilar"}
            </button>
          ))}
        </div>
        {errors.interes && <p className="text-xs text-destructive">{errors.interes}</p>}
      </div>

      {/* Urgencia */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">¿Cuál es tu urgencia?</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["inmediata", "1-3_meses", "3-6_meses", "solo_explorando"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleChange("urgencia", opt)}
              className={`py-2 px-3 rounded-md border text-sm transition-colors ${
                form.urgencia === opt
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-secondary"
              }`}
            >
              {urgenciaLabels[opt]}
            </button>
          ))}
        </div>
        {errors.urgencia && <p className="text-xs text-destructive">{errors.urgencia}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full mt-2" disabled={submitting}>
        {submitting ? "Enviando..." : "Solicitar información"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Al enviar, aceptas nuestra política de privacidad.
      </p>
    </form>
  );
}