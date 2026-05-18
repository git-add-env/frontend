import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Progress } from "@/components/ui/progress";

import {
  Heart,
  Clock3,
  User,
  CheckCircle2,
} from "lucide-react";

export default function MeetingCard() {
  return (
    <Card className="w-[520px] rounded-2xl border-0 bg-[#f9f9f9] p-3 shadow-none">
      <CardContent className="flex items-center gap-3 p-0">

        {/* 이미지 */}
        <div className="h-[110px] w-[110px] overflow-hidden rounded-2xl">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
            alt="모임 이미지"
            className="h-full w-full object-cover"
          />
        </div>

        {/* 오른쪽 영역 */}
        <div className="flex flex-1 flex-col justify-between self-stretch">

          {/* 상단 */}
          <div className="flex items-start justify-between">
            <div>

              {/* 제목 + 상태 */}
              <div className="flex items-center gap-1">
                <h2 className="text-base font-bold">
                  개발자 네트워킹 모임
                </h2>

                <CheckCircle2
                  className="text-emerald-400"
                  size={14}
                />

                <span className="text-xs font-medium text-emerald-400">
                  개설확정
                </span>
              </div>

              {/* 날짜 / 마감 */}
              <div className="mt-2 flex items-center gap-1">
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0.5 text-[10px]"
                >
                  5월 18일
                </Badge>

                <Badge
                  className="flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] text-sky-600"
                >
                  <Clock3 size={10} />
                  오늘 마감
                </Badge>
              </div>
            </div>

            {/* 찜 버튼 */}
            <button className="flex h-8 w-8 items-center justify-center rounded-full border bg-white">
              <Heart
                className="text-gray-400"
                size={14}
              />
            </button>
          </div>

          {/* 하단 */}
          <div className="mt-4 flex items-center justify-between">

            {/* 인원 */}
            <div className="flex flex-1 items-center gap-1.5">
              <User
                className="text-gray-400"
                size={14}
              />

              <Progress
                value={95}
                className="h-1.5 w-[130px]"
              />

              <span className="text-sm font-semibold text-emerald-500">
                19
                <span className="text-gray-500">/20</span>
              </span>
            </div>

            {/* 참여 버튼 */}
            <Button
              className="h-8 rounded-lg border border-emerald-400 bg-white px-3 text-xs font-semibold text-emerald-500 hover:bg-emerald-50"
            >
              참여하기
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}