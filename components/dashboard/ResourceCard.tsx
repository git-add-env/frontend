"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import {
  useCreateResource,
  useDeleteResource,
  useResources,
} from "@/hooks/dashboard/use-resources"
import { ApiFetchError } from "@/lib/api/api-fetch"
import { errorMessage } from "@/lib/api/error"

type ResourceCardProps = {
  meetingId: number
  isLeader: boolean
}

export function ResourceCard({ meetingId, isLeader }: ResourceCardProps) {
  const { data: resources, isError } = useResources(meetingId)
  const createResource = useCreateResource(meetingId)
  const deleteResource = useDeleteResource(meetingId)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function add() {
    setError(null)
    try {
      await createResource.mutateAsync({ title, url })
      setTitle("")
      setUrl("")
      setAdding(false)
    } catch (e) {
      setError(e instanceof ApiFetchError ? errorMessage(e) : "자료 추가에 실패했습니다.")
    }
  }

  // 휴지통 클릭 → 확인 다이얼로그를 띄우고, 확인 시 실제 삭제한다.
  function confirmRemove() {
    if (pendingId === null) return
    deleteResource.mutate(pendingId, {
      onSuccess: () => setPendingId(null),
      onError: () => setDeleteError("자료 삭제에 실패했습니다."),
    })
  }

  const pendingTitle = resources?.find((r) => r.id === pendingId)?.title ?? null
  // http(s)로 시작하는 주소만 허용 (javascript: 등 위험 스킴 차단).
  const isValidUrl = /^https?:\/\//i.test(url.trim())
  const canSubmit = title.trim() !== "" && isValidUrl

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">자료실</h2>
        {isLeader && (
          <Button size="xs" variant="outline" onClick={() => setAdding((v) => !v)}>
            {adding ? "취소" : "링크 추가"}
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-3 flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            size="sm"
            onClick={add}
            disabled={!canSubmit || createResource.isPending}
          >
            {createResource.isPending ? "추가 중..." : "추가"}
          </Button>
        </div>
      )}

      {adding && url.trim() !== "" && !isValidUrl && (
        <p className="mb-2 text-xs text-destructive">
          http:// 또는 https:// 로 시작하는 주소를 입력해주세요.
        </p>
      )}

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      {isError ? (
        <p className="text-sm text-muted-foreground">자료를 불러오지 못했습니다.</p>
      ) : !resources ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 자료가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
            >
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate text-sm text-primary hover:underline"
              >
                {resource.title}
              </a>
              {isLeader && (
                <button
                  type="button"
                  onClick={() => setPendingId(resource.id)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="삭제"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingId(null)
            setDeleteError(null)
          }
        }}
        title="자료 삭제"
        description={`${pendingTitle ? `'${pendingTitle}' ` : ""}자료를 삭제하시겠어요? 삭제하면 되돌릴 수 없습니다.`}
        loading={deleteResource.isPending}
        error={deleteError}
        onConfirm={confirmRemove}
      />
    </div>
  )
}
