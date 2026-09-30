"use client";

import { useState } from "react";
import { LESSONS, SUBJECTS } from "@/data/catalog";
import { PageHeader } from "@/components/ui/primitives";
import { CourseList, LessonFilter } from "@/components/home/CourseList";

export default function CrashCoursesPage() {
  const [filter, setFilter] = useState("");
  const courses = SUBJECTS.map((s) => ({
    id: s.id,
    title: s.name,
    runtime: s.videoRuntime,
    count: s.lessonCount,
    lessons: LESSONS[s.id],
    href: `/nclex/crash-courses/videos/${s.id}`,
  }));
  return (
    <>
      <PageHeader
        trail={[{ label: "Crash Courses" }]}
        title="Crash Course Videos"
        description="Review the most tested NCLEX concepts with our videos and bite-sized quizzes! More lessons will be added weekly!"
      />
      <div className="mt-4">
        <LessonFilter value={filter} onChange={setFilter} />
        <CourseList courses={courses} filter={filter} />
      </div>
    </>
  );
}
