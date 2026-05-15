import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "../_components/page-header";
import { BankDetailsForm } from "./bank-form";

export const metadata = { title: "Payouts — WeFetePass" };

type Payout = {
  id: string;
  period: string;
  gross_cents: number;
  fee_cents: number;
  net_cents: number;
  status: string;
};

export default function PayoutsPage() {
  // Payouts table not yet in the schema — render an empty stub.
  const payouts: Payout[] = [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts"
        description="We pay out the Monday after every event. Track your runs here."
      />

      {payouts.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-6 w-6" aria-hidden />}
          title="No payouts yet"
          description="First payout drops the Monday after your first event. Add your bank details so we can wire it through."
        />
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Period</th>
                  <th className="px-4 py-3 text-left font-medium">Gross</th>
                  <th className="px-4 py-3 text-left font-medium">Fees</th>
                  <th className="px-4 py-3 text-left font-medium">Net</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
            </table>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Bank details</h2>
          <p className="text-sm text-muted-foreground">
            Republic, Scotiabank, First Citizens, or RBC all work. We deposit in TTD.
          </p>
          <BankDetailsForm />
        </CardContent>
      </Card>
    </div>
  );
}
