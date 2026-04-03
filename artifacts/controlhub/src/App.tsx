import { useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CompanyProvider, useCompany } from "@/context/CompanyContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import AdminCompanies from "@/pages/admin/companies";
import Dashboard from "@/pages/dashboard";
import Invoices from "@/pages/finance/invoices";
import Suppliers from "@/pages/finance/suppliers";
import Employees from "@/pages/hr/employees";
import EmployeeDetail from "@/pages/hr/employee-detail";
import Attendance from "@/pages/attendance";
import Documents from "@/pages/documents";
import Announcements from "@/pages/announcements";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useCompany();
  if (!user) return <Login />;
  return <Component />;
}

function SuperAdminRoute() {
  const { user } = useCompany();
  if (!user) return <Login />;
  if (user.role !== "superadmin") return <Login />;
  return <AdminCompanies />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/admin" component={SuperAdminRoute} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/finance/invoices">
        <ProtectedRoute component={Invoices} />
      </Route>
      <Route path="/finance/suppliers">
        <ProtectedRoute component={Suppliers} />
      </Route>
      <Route path="/hr/employees/:id">
        <ProtectedRoute component={EmployeeDetail} />
      </Route>
      <Route path="/hr/employees">
        <ProtectedRoute component={Employees} />
      </Route>
      <Route path="/attendance">
        <ProtectedRoute component={Attendance} />
      </Route>
      <Route path="/documents">
        <ProtectedRoute component={Documents} />
      </Route>
      <Route path="/announcements">
        <ProtectedRoute component={Announcements} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithQueryClient() {
  const [, setLocation] = useLocation();

  const [queryClient] = useState(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (error: unknown) => {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          (error as { status: number }).status === 401
        ) {
          setLocation("/login");
        }
      },
    }),
    defaultOptions: {
      queries: { retry: 1, staleTime: 30000 },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <CompanyProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppWithQueryClient />
      </WouterRouter>
    </CompanyProvider>
  );
}

export default App;
