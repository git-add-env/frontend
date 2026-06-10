"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ApiFetchError } from "@/lib/api/api-fetch"
import {
  createResource,
  deleteResource,
  fetchResources,
  type Resource,
} from "@/lib/api/dashboard"
import { errorMessage } from "@/lib/api/error"

type ResourceCardProps = {
  meetingId: number
  isLeader: boolean
}

export function ResourceCard({ meetingId, isLeader }: ResourceCardProps) {
  const [resources, setResources] = useState<Resource[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchResources(meetingId)
      .then((res) => setResources(res.resources))
      .catch(() => setError("자료를 불러오지 못했습니다."))
  }, [meetingId])

  async function add() {
    setError(null)
    try {
      const created = await createResource(meetingId, { title, url })
      setResources((prev) => [...(prev ?? []), created])
      setTitle("")
      setUrl("")
      setAdding(false)
    } catch (e) {
      setError(e instanceof ApiFetchError ? errorMessage(e) : "자료 추가에 실패했습니다.")
    }
  }

  async function remove(resourceId: number) {
    try {
      await deleteResource(meetingId, resourceId)
      setResources((prev) => prev?.filter((r) => r.id !== resourceId) ?? null)
    } catch {
      setError("자료 삭제에 실패했습니다.")
    }
  }

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
          <Button size="sm" onClick={add}>
            추가
          </Button>
        </div>
      )}

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      {!resources ? (
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
                className="text-sm text-primary hover:underline"
              >
                {resource.title}
              </a>
              {isLeader && (
                <button
                  type="button"
                  onClick={() => remove(resource.id)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="삭제"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
