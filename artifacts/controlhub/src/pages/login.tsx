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
import { Activity, Command, ShieldAlert } from "lucide-react";

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
    <div className="min-h-screen w-full grid md:grid-cols-2 bg-background">
      {/* Left side - Branding */}
      <div className="hidden md:flex flex-col justify-between bg-card border-r border-border/50 p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight text-primary mb-2">
            <Command className="w-8 h-8" />
            <span>ControlHub</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-sm">
            Plataforma de gestión empresarial para operaciones modernas.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Centro de mando en tiempo real</h3>
              <p className="text-sm text-muted-foreground">Monitorea KPIs, asistencia y métricas financieras en un solo lugar.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Seguridad de nivel bancario</h3>
              <p className="text-sm text-muted-foreground">Control de acceso por roles y auditoría detallada de acciones.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ControlHub. Todos los derechos reservados.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight">Iniciar sesión</h1>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder a tu espacio de trabajo
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
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="nombre@empresa.com" 
                          {...field} 
                          className="bg-card"
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
                        <FormLabel>Contraseña</FormLabel>
                        <a href="#" className="text-xs text-primary hover:underline" tabIndex={-1}>
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="bg-card"
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
                className="w-full" 
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
