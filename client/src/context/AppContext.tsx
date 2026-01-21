import { createContext, useState, type ReactNode, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";

interface AppContextType {
  credit: number;
  setCredit: React.Dispatch<React.SetStateAction<number>>;
  loadCreditData: () => Promise<void>;
  backendUrl: string;
}

export const AppContext = createContext<AppContextType | null>(null);

const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [credit, setCredit] = useState<number>(0);
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
  const { getToken } = useAuth();

  // Use useCallback to memoize the function
const loadCreditData = useCallback(async () => {
    try {
        const token = await getToken();

        if (!token) {
            console.log("No token available");
            return;
        }

        // Ensure proper URL formatting
        const url = `${backendUrl.replace(/\/$/, '')}/api/user/credits`;
        console.log("Fetching from:", url); // Debug log

        const { data } = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        console.log("Credit API response:", data);

        if (data?.success) {
            const creditValue = Number(data.credits);
            if (!isNaN(creditValue)) {
                setCredit(creditValue);
                console.log("Credits loaded:", creditValue);
            }
        } else {
            toast.error(data.message || "Failed to load credits");
        }
    } catch (error: any) {
        console.error("Error loading credits:", error);
        toast.error(error.response?.data?.message || "Failed to load credits");
    }
}, [getToken, backendUrl]);

  const value: AppContextType = {
    credit,
    setCredit,
    loadCreditData,
    backendUrl,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;