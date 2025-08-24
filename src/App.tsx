import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Welcome from "./pages/Welcome";
import Wallet from "./pages/Wallet";
import CredentialDetail from "./pages/CredentialDetail";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { VerificationPortal } from "./components/VerificationPortal";
import DigiLocker from "./pages/DigiLocker";
import Settings from "./pages/Settings";
import SettingsLayout from "./pages/settings/SettingsLayout";
import GeneralSettings from "./pages/settings/GeneralSettings";
import AccountSettings from "./pages/settings/AccountSettings";
import SecuritySettings from "./pages/settings/SecuritySettings";
import BackupSettings from "./pages/settings/BackupSettings";
import DeviceSettings from "./pages/settings/DeviceSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/credential/:id" element={<CredentialDetail />} />
            <Route path="/verify" element={<VerificationPortal />} />
            <Route path="/digilocker" element={<DigiLocker />} />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<GeneralSettings />} />
              <Route path="account" element={<AccountSettings />} />
              <Route path="security" element={<SecuritySettings />} />
              <Route path="backup" element={<BackupSettings />} />
              <Route path="devices" element={<DeviceSettings />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
