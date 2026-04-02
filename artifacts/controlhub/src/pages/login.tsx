import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useCompany } from "@/context/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Activity, Command, ShieldAlert, Layers } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { setUser, setCompany, setCompanyId } = useCompany();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setUser(data.user);
          setCompany(data.company);
          setCompanyId(data.company.id);
          setLocation("/");
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Error al iniciar sesión",
            description: error.message || "Credenciales incorrectas",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-card/40 border-r border-border/20 p-12 relative overflow-hidden w-1/2 max-w-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 font-bold text-3xl tracking-tight text-foreground mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Command className="w-6 h-6" />
            </div>
            <span>ControlHub</span>
          </div>
          <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
            El centro de mando empresarial para operaciones modernas y equipos de alto rendimiento.
          </p>
        </div>

        <div className="relative z-10 space-y-8 my-16">
          <div className="flex items-start gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center shrink-0 shadow-sm group-hover:border-primary/30 transition-colors">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1 text-foreground">Visibilidad en tiempo real</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Monitorea KPIs, asistencia y métricas financieras consolidadas en un solo lugar.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center shrink-0 shadow-sm group-hover:border-primary/30 transition-colors">
              <ShieldAlert className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1 text-foreground">Seguridad de nivel corporativo</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Control estricto de accesos por roles, auditoría detallada y cumplimiento normativo.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center shrink-0 shadow-sm group-hover:border-primary/30 transition-colors">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1 text-foreground">Gestión integral unificada</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Facturación, recursos humanos, y documentos centralizados en un único ecosistema.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ControlHub Enterprise.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="absolute top-6 right-6 lg:hidden flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            <Command className="w-5 h-5" />
          </div>
          <span>ControlHub</span>
        </div>
        
        <div className="w-full max-w-md space-y-8 bg-card/30 p-8 sm:p-10 rounded-2xl border border-border/40 backdrop-blur-xl shadow-2xl">
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Bienvenido de nuevo</h1>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales corporativas para acceder
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Correo corporativo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="nombre@empresa.com" 
                          {...field} 
                          className="bg-background/50 h-11 border-border/50 focus-visible:ring-primary/50 transition-all"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-foreground/80">Contraseña</FormLabel>
                        <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium" tabIndex={-1}>
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="bg-background/50 h-11 border-border/50 focus-visible:ring-primary/50 transition-all"
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all" 
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Autenticando..." : "Ingresar a ControlHub"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
