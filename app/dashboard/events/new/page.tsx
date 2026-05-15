import { PageHeader } from "../../_components/page-header";
import { EventForm } from "../_components/event-form";

export const metadata = { title: "New event — WeFetePass" };

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create event"
        description="Get the basics down — you can polish later."
      />
      <EventForm mode="create" />
    </div>
  );
}
