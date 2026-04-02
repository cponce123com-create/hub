import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile, Company } from "@workspace/api-client-react";

interface CompanyContextType {
  companyId: number;
  setCompanyId: (id: number) => void;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  company: Company | null;
  setCompany: (company: Company | null) => void;
  logout: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companyId, setCompanyId] = useState<number>(1);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("controlhub_user");
    const storedCompany = localStorage.getItem("controlhub_company");
    const storedCompanyId = localStorage.getItem("controlhub_companyId");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedCompany) setCompany(JSON.parse(storedCompany));
    if (storedCompanyId) setCompanyId(Number(storedCompanyId));
  }, []);

  // Save to localStorage on change
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

  const logout = () => {
    setUser(null);
    setCompany(null);
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
