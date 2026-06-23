import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { MeetingRoom } from "@/lib/api/dashboard"

type ActiveConference = {
  meetingId: number
  roomId: string
  userId: string
}

type ConferenceConnection = MeetingRoom & ActiveConference

type ConferenceState = {
  activeConference: ActiveConference | null
  connection: ConferenceConnection | null
  canEnterConference: (meetingId: number, userId: string) => boolean
  setConnection: (
    meetingId: number,
    userId: string,
    room: MeetingRoom
  ) => boolean
  activateConference: (meetingId: number, userId: string) => boolean
  clearConference: (meetingId?: number) => void
}

export const useConferenceStore = create<ConferenceState>()(
  persist(
    (set, get) => ({
      activeConference: null,
      connection: null,
      canEnterConference: (meetingId, userId) => {
        const activeConference = get().activeConference
        const connection = get().connection

        return (
          (!activeConference ||
            activeConference.userId !== userId ||
            activeConference.meetingId === meetingId) &&
          (!connection ||
            connection.userId !== userId ||
            connection.meetingId === meetingId)
        )
      },
      setConnection: (meetingId, userId, room) => {
        if (!get().canEnterConference(meetingId, userId)) {
          return false
        }

        set({
          connection: {
            ...room,
            meetingId,
            roomId: room.roomId,
            userId,
          },
        })

        return true
      },
      activateConference: (meetingId, userId) => {
        const connection = get().connection

        if (
          !connection ||
          connection.meetingId !== meetingId ||
          connection.userId !== userId
        ) {
          return false
        }

        set({
          activeConference: {
            meetingId,
            roomId: connection.roomId,
            userId,
          },
        })

        return true
      },
      clearConference: (meetingId) => {
        const activeConference = get().activeConference
        const connection = get().connection

        if (
          meetingId !== undefined &&
          activeConference?.meetingId !== meetingId &&
          connection?.meetingId !== meetingId
        ) {
          return
        }

        set({ activeConference: null, connection: null })
      },
    }),
    {
      name: "active-video-conference-v2",
      partialize: (state) => ({
        activeConference: state.activeConference,
        connection: null,
      }),
    }
  )
)
