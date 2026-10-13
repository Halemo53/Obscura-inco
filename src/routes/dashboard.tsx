import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ConnectGate } from "@/components/ConnectGate";
import { useWallet } from "@/lib/wallet";
import { useIncoData } from "@/lib/use-inco";
import { useAuditStreamDriver, useStreamSnapshot } from "@/hooks/useAuditStream";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function StreamDriver() {
  const { address, isEvm } = useWallet();
  const data = useIncoData(address);
  const { live } = useStreamSnapshot();
  useAuditStreamDriver(address, data?.vouchers, live && isEvm);
  return null;
}

function DashboardLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header />
        <StreamDriver />
        <main className="px-6 py-6">
          <ConnectGate>
            <Outlet />
          </ConnectGate>
        </main>
      </div>
    </div>
  );
}
