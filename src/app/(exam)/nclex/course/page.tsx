"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAll } from "@/lib/content";
import { CoursePlayer } from "@/components/exam/LessonPlayer";

/** Lesson player for courses created in the admin: /nclex/course?id=…&index=… */
function Player() {
  const id = useSearchParams().get("id") ?? "";
  const course = useAll("courses").find((c) => c.id === id);
  const back = course?.kind === "ngn" ? "/nclex/next-gen-strategy-course/videos" : "/nclex/crash-courses";
  return <CoursePlayer course={id} fallbackTitle={course?.title ?? "Course"} base={`/nclex/course?id=${encodeURIComponent(id)}`} back={back} />;
}

export default function CoursePage() {
  return (
    <Suspense>
      <Player />
    </Suspense>
  );
}
