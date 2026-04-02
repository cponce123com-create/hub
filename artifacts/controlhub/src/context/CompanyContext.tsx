import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile, Company } from "@workspace/api-client-react";

interface CompanyContextType {
  companyId: number;
  setCompanyId: (id: number) => void;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  company: Company | null;
  setCompany: (company: Company | null) => void;
  isSuperAdmin: boolean;
  activeCompany: { id: number; name: string } | null;
  setActiveCompany: (c: { id: number; name: string } | null) => void;
  logout: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companyId, setCompanyId] = useState<number>(1);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [activeCompany, setActiveCompany] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("controlhub_user");
    const storedCompany = localStorage.getItem("controlhub_company");
    const storedCompanyId = localStorage.getItem("controlhub_companyId");
    const storedActiveCompany = localStorage.getItem("controlhub_activeCompany");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedCompany) setCompany(JSON.parse(storedCompany));
    if (storedCompanyId) setCompanyId(Number(storedCompanyId));
    if (storedActiveCompany) setActiveCompany(JSON.parse(storedActiveCompany));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("controlhub_user", JSON.stringify(user));
    else localStorage.removeItem("controlhub_user");
  }, [user]);

  useEffect(() => {
    if (company) localStorage.setItem("controlhub_company", JSON.stringify(company));
    else localStorage.removeItem("controlhub_company");
  }, [company]);

  useEffect(() => {
    localStorage.setItem("controlhub_companyId", companyId.toString());
  }, [companyId]);

  useEffect(() => {
    if (activeCompany) localStorage.setItem("controlhub_activeCompany", JSON.stringify(activeCompany));
    else localStorage.removeItem("controlhub_activeCompany");
  }, [activeCompany]);

  const isSuperAdmin = user?.role === "superadmin";

  const logout = () => {
    setUser(null);
    setCompany(null);
    setActiveCompany(null);
  };

  return (
    <CompanyContext.Provider
      value={{
        companyId,
        setCompanyId,
        user,
        setUser,
        company,
        setCompany,
        isSuperAdmin,
        activeCompany,
        setActiveCompany,
        logout,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
