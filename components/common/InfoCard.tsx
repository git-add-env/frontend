import { Button } from "@/components/ui/button"

export default function InfoCard() {
  return (
    <div className="rounded-3xl border border-border bg-muted p-6 shadow-sm shadow-slate-900/5">
      <div className="mb-4 space-y-2">
        <p className="text-sm font-medium text-secondary">Common UI</p>
        <h2 className="text-2xl font-semibold">Welcome to the shared card</h2>
        <p className="text-sm text-muted-foreground">
          This simple card is placed under `components/common` and can be reused in any page.
        </p>
      </div>
      <div className="space-y-3 text-sm">
        <p>• Use this area for shared UI elements.</p>
        <p>• Keep styling simple and reusable.</p>
      </div>
      <Button className="mt-6">Common Action</Button>
    </div>
  )
}
