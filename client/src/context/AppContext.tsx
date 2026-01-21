import { createContext, useState, ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext<any>(null);

const AppContextProvider = (props: { children: ReactNode }) => {
  const [CreditCard, setCredit] = useState<boolean | number>(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;

  const { getToken } = useAuth();

  const loadCreditData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        backendUrl + "api/user/credits",
        { headers: { token } }
      );

      if (data.success) {
        setCredit(data.credits);
      }
    } catch (error: any) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const value = {
    credit: CreditCard,
    setCredit,
    loadCreditData,
    backendUrl,
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
