import { Button } from "@/components/ui/button"
import InfoCard from "@/components/common/InfoCard"
import MeetingCard from "@/components/common/MeetingCard";

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="grid w-full max-w-3xl gap-6 text-sm leading-loose md:grid-cols-[minmax(0,1fr)_minmax(320px,40%)]">
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <h1 className="font-medium">Project ready!</h1>
            <p>You may now add components and start building.</p>
            <p>We&apos;ve already added the button component for you.</p>
            <Button className="mt-2">Button</Button>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            (Press <kbd>d</kbd> to toggle dark mode)
          </div>
        </div>

        <InfoCard />
        <MeetingCard/>
      </div>
    </div>
    
  )
}
