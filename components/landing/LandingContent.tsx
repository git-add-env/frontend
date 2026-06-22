"use client"

import { useEffect } from "react"
import type { CSSProperties } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Bookmark,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  LayoutDashboard,
  LineChart,
  LogOut,
  Megaphone,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  MousePointer2,
  Search,
  ShieldCheck,
  TrendingUp,
  User,
  UserPlus,
  Users,
  Video,
  VideoOff,
  Zap,
} from "lucide-react"

import styles from "./landing.module.css"

/** Maps space-separated design tokens to hashed CSS-module class names. */
const cx = (...names: string[]) =>
  names
    .flatMap((n) => n.split(" "))
    .filter(Boolean)
    .map((n) => styles[n] ?? n)
    .join(" ")

/** Allow CSS custom properties in inline styles. */
type Vars = CSSProperties & Record<`--${string}`, string | number>
const v = (vars: Vars) => vars

type Participant = {
  /** Avatar initial / fallback text. */
  name: string
  /** Name label in the bottom-left badge (defaults to `name`). */
  label?: string
  avatarColor: string
  /** Camera-on slot. Ring/glow colors for the speaking highlight. */
  speaking?: { ring: string; glow: string }
  /** Drop a video path here to play real footage over the avatar fallback. */
  videoSrc?: string
}

const PARTICIPANTS: Participant[] = [
  // 카메라 ON 슬롯 — videoSrc 에 영상 경로를 넣으면 아바타 위에 재생됩니다.
  {
    name: "민준",
    avatarColor: "#7FB4FF",
    speaking: { ring: "#1ABCFE", glow: "rgba(26,188,254,0.55)" },
    videoSrc: "/videos/minjun.mp4",
  },
  {
    name: "서연",
    avatarColor: "#6FD3A8",
    speaking: { ring: "#0ACF83", glow: "rgba(10,207,131,0.55)" },
    videoSrc: "/videos/seoyeon.mp4",
  },
  // 카메라 OFF 슬롯
  { name: "지훈", avatarColor: "#7FB4FF" },
  { name: "하린", avatarColor: "#D89BFF" },
  {
    name: "도운",
    avatarColor: "#D89BFF",
    speaking: { ring: "#A259FF", glow: "rgba(162,89,255,0.55)" },
    videoSrc: "/videos/doun.mp4",
  },
  { name: "준현", label: "나", avatarColor: "#6FD3A8" },
]

export function LandingContent() {
  useEffect(() => {
    // 새로고침 시 브라우저가 이전 스크롤 위치를 복원하지 않도록 막고 맨 위에서 시작.
    // 진입 시점 값을 저장해 언마운트 때 그대로 복원(전역 정책 오염 방지).
    const supportsScrollRestoration = "scrollRestoration" in window.history
    const prevScrollRestoration = supportsScrollRestoration
      ? window.history.scrollRestoration
      : undefined
    if (supportsScrollRestoration) {
      window.history.scrollRestoration = "manual"
    }
    window.scrollTo(0, 0)

    // Reveal-on-scroll
    const revealEls = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    )
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(styles.in)
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    )
    revealEls.forEach((el) => io.observe(el))

    // Video-call join: auto-trigger when the stage scrolls into view
    const stage = document.querySelector<HTMLElement>("[data-vc-stage]")
    const btn = document.querySelector<HTMLElement>("[data-vc-join]")
    let done = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const start = () => {
      if (done || !stage || !btn) return
      done = true
      stage.classList.add(styles.armed)
      timers.push(setTimeout(() => btn.classList.add(styles.pressing), 820))
      timers.push(setTimeout(() => stage.classList.add(styles.started), 1350))
    }
    btn?.addEventListener("click", start)
    let so: IntersectionObserver | undefined
    if (stage) {
      so = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              start()
              so?.disconnect()
            }
          })
        },
        { threshold: 0.25 },
      )
      so.observe(stage)
    }

    return () => {
      io.disconnect()
      so?.disconnect()
      btn?.removeEventListener("click", start)
      timers.forEach(clearTimeout)
      // 진입 시점 값으로 원복 (다른 페이지의 스크롤 복원 정책 보존)
      if (supportsScrollRestoration && prevScrollRestoration) {
        window.history.scrollRestoration = prevScrollRestoration
      }
    }
  }, [])

  return (
    <div className={cx("page")}>
      {/* ===================== HERO ===================== */}
      <header className={cx("hero")} id="top">
        <div className={cx("nodes")} aria-hidden="true">
          <span className={cx("node-wrap n1")}>
            <span className={cx("node")}>
              <Megaphone />
            </span>
          </span>
          <span className={cx("node-wrap n2")}>
            <span className={cx("node")}>
              <Calendar />
            </span>
          </span>
          <span className={cx("node-wrap n3")}>
            <span className={cx("node")}>
              <FileText />
            </span>
          </span>
          <span className={cx("node-wrap n4")}>
            <span className={cx("node")}>
              <Video />
            </span>
          </span>
          <span className={cx("node-wrap n5")}>
            <span className={cx("node")}>
              <User />
            </span>
          </span>
          <span className={cx("node-wrap n6")}>
            <span className={cx("node")}>
              <CheckCircle2 />
            </span>
          </span>
        </div>

        <div className={cx("wrap")}>
          <div className={cx("hero-kicker")}>
            <span className={cx("live")}>
              <i />
              LIVE
            </span>
            비대면 협업을 위한 개발자 팀 매칭 &amp; 화상회의
          </div>
          <h1>
            모집부터 화상회의까지,
            <br />
            <span className={cx("grad-text")}>하나로</span>
          </h1>
          <p className={cx("sub")}>
            흩어진 툴은 그만. 프로젝트·해커톤·공모전 팀을 찾고, 대시보드로
            관리하고,
            <br />
            바로 화상회의로 만나세요.
          </p>
          <div className={cx("hero-cta")}>
            <Link className={cx("btn btn-primary btn-lg")} href="/meetings">
              지금 시작하기
            </Link>
          </div>
          <p className={cx("hero-note")} />

          <div className={cx("mock")}>
            <div className={cx("float f1")}>
              <span
                className={cx("ic")}
                style={v({
                  background: "rgba(10,207,131,0.12)",
                  color: "var(--green)",
                })}
              >
                <Check />
              </span>
              <div>
                <div className={cx("t")}>참가 완료</div>
                <div className={cx("s")}>강도윤님이 참가했어요</div>
              </div>
            </div>
            <div className={cx("float f2")}>
              <span
                className={cx("ic")}
                style={v({
                  background: "rgba(255,114,98,0.14)",
                  color: "var(--orange)",
                })}
              >
                <Clock />
              </span>
              <div>
                <div className={cx("t")}>마감 18시간 전</div>
                <div className={cx("s")}>핀테크 해커톤</div>
              </div>
            </div>

            <div className={cx("win")}>
              <div className={cx("win-bar")}>
                <div className={cx("tr")}>
                  <i style={{ background: "#FF5F57" }} />
                  <i style={{ background: "#FEBC2E" }} />
                  <i style={{ background: "#28C840" }} />
                </div>
                <span className={cx("ti")}>
                  <span className={cx("brand")} style={{ fontSize: 14 }}>
                    <span
                      className={cx("dot")}
                      style={{
                        width: 7,
                        height: 7,
                        boxShadow: "0 0 0 3px rgba(26,188,254,0.18)",
                      }}
                    />
                    내 모임
                  </span>
                </span>
                <span className={cx("seg")}>
                  <b className={cx("active")}>모집중</b>
                  <b>활동중</b>
                </span>
              </div>
              <div className={cx("mk-body")}>
                <div className={cx("gcard")}>
                  <div
                    className={cx("thumb")}
                    style={{
                      background: "linear-gradient(150deg,#FF7A45,#FF2D8E)",
                    }}
                  >
                    <Zap />
                  </div>
                  <div className={cx("meta")}>
                    <div className={cx("toprow")}>
                      <span className={cx("gpill hack")}>해커톤</span>
                      <span className={cx("ddl urgent")}>
                        <Clock />
                        오늘 마감
                      </span>
                      <span className={cx("more")}>
                        <MoreHorizontal />
                      </span>
                    </div>
                    <h4>AI 해커톤 경연대회</h4>
                    <div className={cx("recruit")}>
                      <span className={cx("rl")}>
                        <Users />
                        모집 현황
                      </span>
                      <span className={cx("track")}>
                        <i style={{ width: "13%" }} />
                      </span>
                      <span className={cx("num")}>1/8</span>
                    </div>
                  </div>
                </div>
                <div className={cx("gcard")}>
                  <div
                    className={cx("thumb")}
                    style={{
                      background: "linear-gradient(150deg,#0ACF83,#1ABCFE)",
                    }}
                  >
                    <FileText />
                  </div>
                  <div className={cx("meta")}>
                    <div className={cx("toprow")}>
                      <span className={cx("gpill proj")}>프로젝트</span>
                      <span className={cx("ddl")}>
                        <Clock />
                        D-6
                      </span>
                      <span className={cx("more")}>
                        <MoreHorizontal />
                      </span>
                    </div>
                    <h4>모여ON v2 리뉴얼 — 프론트 2명</h4>
                    <div className={cx("recruit")}>
                      <span className={cx("rl")}>
                        <Users />
                        모집 현황
                      </span>
                      <span className={cx("track")}>
                        <i style={{ width: "50%" }} />
                      </span>
                      <span className={cx("num")}>3/6</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===================== PROBLEM ===================== */}
      <section className={cx("section")} id="problem">
        <div className={cx("wrap")}>
          <div className={cx("sec-head reveal")} data-reveal>
            <h2>이런 경험, 없으셨나요?</h2>
            <p>
              팀을 만드는 과정은 늘 흩어져 있었어요. 모여ON은 그 흐름을 하나로
              모읍니다.
            </p>
          </div>
          <div className={cx("pain-grid")}>
            <div className={cx("pain-card reveal")} data-reveal>
              <span className={cx("x")}>
                <Search />
              </span>
              <h4>
                팀원 구하려고
                <br />
                여러 커뮤니티를 전전
              </h4>
              <p>
                오픈채팅, 에브리타임, 디스코드… 모집글을 여기저기 올리고 답을
                기다린 적 있으셨죠.
              </p>
            </div>
            <div className={cx("pain-card reveal d1")} data-reveal>
              <span className={cx("x")}>
                <MessageSquare />
              </span>
              <h4>
                소통 도구가 제각각이라
                <br />
                매번 번거로웠던 적
              </h4>
              <p>
                카톡으로 공지, 드라이브로 자료, 줌으로 회의. 흩어진 도구를 오가며
                시간을 흘려보냈어요.
              </p>
            </div>
            <div className={cx("pain-card reveal d2")} data-reveal>
              <span className={cx("x")}>
                <LineChart />
              </span>
              <h4>
                진행 상황을
                <br />
                한눈에 보기 어려웠던 적
              </h4>
              <p>
                누가 무엇을 하는지, 다음 일정이 언제인지. 팀이 어디까지 왔는지
                파악하기 힘들었죠.
              </p>
            </div>
          </div>
          <p className={cx("pain-foot reveal")} data-reveal>
            팀 매칭부터 협업까지, 이제 모여
            <span className={cx("grad-text")}>ON</span> 한 곳에서.
          </p>
        </div>
      </section>

      {/* ===================== SOLUTION FLOW ===================== */}
      <section className={cx("section wash")} id="flow">
        <div className={cx("wrap")}>
          <div className={cx("sec-head reveal")} data-reveal>
            <h2>탐색부터 화상회의까지, 끊김 없이.</h2>
            <p>네 단계가 자연스럽게 이어집니다. 도구를 바꿔 탈 필요가 없어요.</p>
          </div>
          <div className={cx("flow")}>
            <div className={cx("flow-node reveal")} data-reveal>
              <span
                className={cx("ic")}
                style={v({
                  "--fi": "#0B9E66",
                  "--fi-bg": "rgba(10,207,131,0.13)",
                })}
              >
                <Search />
              </span>
              <h4>모임 탐색</h4>
              <p>카테고리·기술 스택으로 맞는 팀을 찾아요.</p>
            </div>
            <div className={cx("flow-arrow reveal d1")} data-reveal>
              <ArrowRight />
            </div>
            <div className={cx("flow-node reveal d1")} data-reveal>
              <span
                className={cx("ic")}
                style={v({
                  "--fi": "#3D5BEE",
                  "--fi-bg": "rgba(93,123,255,0.13)",
                })}
              >
                <UserPlus />
              </span>
              <h4>참여 신청</h4>
              <p>포지션을 골라 신청하면 바로 팀에 합류해요.</p>
            </div>
            <div className={cx("flow-arrow reveal d2")} data-reveal>
              <ArrowRight />
            </div>
            <div className={cx("flow-node reveal d2")} data-reveal>
              <span
                className={cx("ic")}
                style={v({
                  "--fi": "#7B3FD1",
                  "--fi-bg": "rgba(162,89,255,0.13)",
                })}
              >
                <LayoutDashboard />
              </span>
              <h4>대시보드 관리</h4>
              <p>공지·일정·자료를 한곳에서 굴려요.</p>
            </div>
            <div className={cx("flow-arrow reveal d3")} data-reveal>
              <ArrowRight />
            </div>
            <div className={cx("flow-node reveal d3")} data-reveal>
              <span
                className={cx("ic")}
                style={v({
                  "--fi": "#0E84BC",
                  "--fi-bg": "rgba(26,188,254,0.13)",
                })}
              >
                <Video />
              </span>
              <h4>화상회의</h4>
              <p>버튼 하나로 팀과 바로 만나요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FEATURE 1 — 모임 탐색/참여 ===================== */}
      <section className={cx("section")} id="explore">
        <div className={cx("wrap")}>
          <div className={cx("feature")}>
            <div className={cx("feat-text reveal")} data-reveal>
              <span
                className={cx("feat-icon")}
                style={v({
                  "--fi": "#0B9E66",
                  "--fi-bg": "rgba(10,207,131,0.13)",
                })}
              >
                <Search />
              </span>
              <h3>
                딱 맞는 팀을
                <br />
                카테고리·스택으로 탐색.
              </h3>
              <p>
                프로젝트·해커톤·공모전 모집글에서 기술 스택과 포지션으로
                필터링해, 원하는 팀만 골라 바로 신청하세요.
              </p>
              <ul className={cx("feat-list")}>
                <li>
                  <span className={cx("ck")}>
                    <Check />
                  </span>
                  프로젝트 / 해커톤 / 공모전 카테고리
                </li>
                <li>
                  <span className={cx("ck")}>
                    <Check />
                  </span>
                  기술 스택·포지션 기반 필터링
                </li>
                <li>
                  <span className={cx("ck")}>
                    <Check />
                  </span>
                  정원·마감을 실시간으로 확인
                </li>
              </ul>
            </div>
            <div className={cx("feat-visual reveal d1")} data-reveal>
              <div className={cx("rcard")}>
                <div className={cx("poster")}>
                  <span className={cx("blob b1")} />
                  <span className={cx("blob b2")} />
                  <div className={cx("pt")}>
                    <div className={cx("l1")}>팀으로 도전하는 모든 순간</div>
                    <div className={cx("l2")}>
                      해커톤·공모전
                      <br />
                      프로젝트
                    </div>
                  </div>
                  <div className={cx("ptopic")}>
                    함께할 팀을 찾으세요
                    <b>모여ON에서 팀 매칭부터 협업까지</b>
                  </div>
                  <span className={cx("bm")}>
                    <Bookmark />
                  </span>
                </div>
                <div className={cx("rbody")}>
                  <span className={cx("rpill")}>해커톤 · 공모전 · 프로젝트</span>
                  <h3 className={cx("rtitle")}>팀원 모집 — 함께 도전해요</h3>
                  <div className={cx("ttags")}>
                    <span className={cx("ttag")}>#프로젝트</span>
                    <span className={cx("ttag")}>#공모전</span>
                  </div>
                  <div className={cx("ptags")}>
                    <span className={cx("ptag")}>개발</span>
                    <span className={cx("ptag")}>기획/디자인</span>
                  </div>
                </div>
                <div className={cx("rfoot")}>
                  <span className={cx("lbl")}>
                    <Users />
                    모집 현황
                  </span>
                  <span className={cx("track")}>
                    <i style={{ width: "40%" }} />
                  </span>
                  <span className={cx("cnt")}>2/5</span>
                  <span className={cx("due")}>마감일: 2026.08.01</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FEATURE 2 — 대시보드 ===================== */}
      <section className={cx("section wash")} id="dashboard">
        <div className={cx("wrap")}>
          <div className={cx("feature flip")}>
            <div className={cx("feat-text reveal")} data-reveal>
              <span
                className={cx("feat-icon")}
                style={v({
                  "--fi": "#7B3FD1",
                  "--fi-bg": "rgba(162,89,255,0.13)",
                })}
              >
                <LayoutDashboard />
              </span>
              <h3>
                일정·공지·자료를
                <br />한 대시보드에서.
              </h3>
              <p>
                팀이 합류하면 공지·일정·자료가 한 화면에 모여요. 흩어진 도구를
                오갈 필요 없이 진행 상황을 함께 관리하세요.
              </p>
              <ul className={cx("feat-list")}>
                <li>
                  <span className={cx("ck")}>
                    <Check />
                  </span>
                  공지·일정·자료를 한곳에서
                </li>
                <li>
                  <span className={cx("ck")}>
                    <Check />
                  </span>
                  실시간 알림으로 업데이트 확인
                </li>
                <li>
                  <span className={cx("ck")}>
                    <Check />
                  </span>
                  모집중·활동중 상태를 한눈에
                </li>
              </ul>
            </div>
            <div className={cx("feat-visual reveal d1")} data-reveal>
              <div className={cx("board")}>
                <div className={cx("dash-tabs")}>
                  <b className={cx("active")}>공지</b>
                  <b>일정</b>
                  <b>자료</b>
                  <b>멤버</b>
                </div>
                <div className={cx("board-body")}>
                  <div className={cx("notice")}>
                    <span className={cx("ni")}>
                      <Megaphone />
                    </span>
                    <div className={cx("nt")}>
                      <div className={cx("tr")}>
                        <div className={cx("tt")}>개발 컨벤션 공유</div>
                        <div className={cx("date")}>2026.06.05 (금)</div>
                      </div>
                      <div className={cx("dd")}>
                        브랜치 전략과 커밋 컨벤션을 정리했어요. 자료실 문서
                        참고해주세요.
                      </div>
                    </div>
                  </div>
                  <div className={cx("notice")}>
                    <span className={cx("ni")}>
                      <Megaphone />
                    </span>
                    <div className={cx("nt")}>
                      <div className={cx("tr")}>
                        <div className={cx("tt")}>이번 주 발표 일정 정리</div>
                        <div className={cx("date")}>2026.06.03 (수)</div>
                      </div>
                      <div className={cx("dd")}>
                        수요일 8시 회의 전까지 demo 영상 1분 이내로 올려주세요.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TRANSITION → DARK ===================== */}
      <div className={cx("shift")} aria-hidden="true" />

      {/* ===================== FEATURE 3 — 화상회의 (DARK) ===================== */}
      <section className={cx("dark-sec")} id="meeting">
        <div className={cx("wrap")}>
          <div className={cx("sec-head reveal")} data-reveal>
            <h2>그리고, 바로 만나다.</h2>
            <p>
              밝은 협업이 끝나면 몰입의 시간. 약속도 링크도 없이 팀 안에서 바로
              회의를 켜세요.
            </p>
          </div>
          <div className={cx("dark-feature")}>
            <div className={cx("feat-visual reveal")} data-reveal>
              <div className={cx("vc-stage")} data-vc-stage>
                <div className={cx("vc")}>
                  <div className={cx("vc-topbar")}>
                    <span className={cx("vc-pill")}>
                      <MicOff />
                      Microphone
                      <ChevronDown className={cx("car")} />
                    </span>
                    <span className={cx("vc-pill")}>
                      <VideoOff />
                      Camera
                      <ChevronDown className={cx("car")} />
                    </span>
                    <span className={cx("vc-pill")}>
                      <MonitorUp />
                      Share screen
                    </span>
                    <span className={cx("vc-pill")}>
                      <MessageSquare />
                      Chat
                    </span>
                    <span className={cx("vc-pill leave")}>
                      <LogOut />
                      Leave
                    </span>
                  </div>
                  <div className={cx("vc-grid")}>
                    {PARTICIPANTS.map((p) => (
                      <div
                        key={p.name}
                        className={cx(p.speaking ? "vc-tile speaking" : "vc-tile")}
                        style={
                          p.speaking
                            ? v({
                                "--spk": p.speaking.ring,
                                "--spkglow": p.speaking.glow,
                              })
                            : undefined
                        }
                      >
                        <span className={cx("av")} style={{ color: p.avatarColor }}>
                          {p.name}
                        </span>
                        {p.videoSrc ? (
                          <video
                            className={cx("feed")}
                            src={p.videoSrc}
                            autoPlay
                            muted
                            loop
                            playsInline
                            // 파일이 아직 없으면 아바타 폴백이 보이도록 숨김
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        ) : null}
                        <span className={cx("vc-name")}>
                          {p.label ?? p.name}
                          {p.speaking ? (
                            <Mic className={cx("micon")} />
                          ) : (
                            <>
                              <MicOff className={cx("micoff")} />
                              <VideoOff className={cx("camoff")} />
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={cx("vc-join")}>
                  <button
                    className={cx("vc-join-btn")}
                    type="button"
                    data-vc-join
                  >
                    <Video className={cx("cam")} />
                    화상 회의 시작하기
                    <span className={cx("vc-ripple")} />
                    <MousePointer2 className={cx("vc-cursor")} />
                  </button>
                </div>
              </div>
            </div>
            <div className={cx("dark-points reveal d1")} data-reveal>
              <div className={cx("dark-point")}>
                <span className={cx("ck")}>
                  <Check />
                </span>
                <div>
                  <b>원클릭 회의 시작</b>
                  <span>모임에서 버튼 하나로 바로 켜요.</span>
                </div>
              </div>
              <div className={cx("dark-point")}>
                <span className={cx("ck")}>
                  <Check />
                </span>
                <div>
                  <b>화면 공유</b>
                  <span>데모·디자인을 함께 보며 진행해요.</span>
                </div>
              </div>
              <div className={cx("dark-point")}>
                <span className={cx("ck")}>
                  <Check />
                </span>
                <div>
                  <b>팀원 전체 알림</b>
                  <span>회의가 시작되면 모두에게 알려요.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TRUST ===================== */}
      <section className={cx("section")}>
        <div className={cx("wrap")}>
          <div className={cx("sec-head reveal")} data-reveal>
            <h2>흩어지지 않는 팀을 만드는 이유.</h2>
          </div>
          <div className={cx("trust-grid")}>
            <div className={cx("trust-card reveal")} data-reveal>
              <span className={cx("ic")}>
                <Zap />
              </span>
              <h4>흐름이 끊기지 않아요</h4>
              <p>
                탐색·참여·관리·회의가 한 서비스 안에서 이어져, 도구를 바꿔 탈
                일이 없어요.
              </p>
            </div>
            <div className={cx("trust-card reveal d1")} data-reveal>
              <span className={cx("ic")}>
                <TrendingUp />
              </span>
              <h4>실시간으로 함께 봐요</h4>
              <p>
                지원 현황과 팀 업데이트가 실시간 알림으로 도착해, 누구도 흐름을
                놓치지 않아요.
              </p>
            </div>
            <div className={cx("trust-card reveal d2")} data-reveal>
              <span className={cx("ic")}>
                <ShieldCheck />
              </span>
              <h4>신뢰 기반으로 매칭돼요</h4>
              <p>
                직군·경력·기술 스택이 담긴 프로필로 서로를 확인하고 팀을 꾸려요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className={cx("section")} style={{ paddingTop: 0 }}>
        <div className={cx("wrap")}>
          <div className={cx("cta-band reveal")} data-reveal>
            <div className={cx("inner")}>
              <h2>
                지금 모여<span className={cx("grad-text")}>ON</span>에서
                <br />
                팀을 만나보세요.
              </h2>
              <p>팀원을 모으고, 함께 관리하고, 바로 회의를 켜세요.</p>
              <div className={cx("hero-cta")}>
                <Link className={cx("btn btn-primary btn-lg")} href="/meetings">
                  지금 시작하기
                  <ArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
