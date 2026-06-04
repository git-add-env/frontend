type EmptyOrErrorProps = {
  message: string
}

export function EmptyOrError({ message }: EmptyOrErrorProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
