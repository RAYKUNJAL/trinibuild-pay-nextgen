import { getVariant } from "@/lib/ab/get-variant";
import type { ExperimentKey, VariantOf } from "@/lib/ab/variants";

export async function Variant<K extends ExperimentKey>({
  experiment,
  name,
  children,
}: {
  experiment: K;
  name: VariantOf<K>;
  children: React.ReactNode;
}) {
  const assigned = await getVariant(experiment);
  if (assigned !== name) return null;
  return <>{children}</>;
}
