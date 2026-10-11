"use client";

import { useState } from "react";
import { asLesson, useCourses, usePublished, useSubjects } from "@/lib/content";
import { PageHeader } from "@/components/ui/primitives";
import { CourseList, LessonFilter } from "@/components/home/CourseList";

export default function CrashCoursesPage() {
  const [filter, setFilter] = useState("");
  const subjects = useSubjects();
  const courseRecs = useCourses("subject");
  const lessons = usePublished("lessons");
  // One course per visible subject, in subject order; course titles/runtimes come from Admin > Courses & Lessons.
  const courses = subjects
    .map((s) => ({ s, c: courseRecs.find((c) => c.id === s.id) }))
    .filter(({ c }) => c)
    .map(({ s, c }) => {
      const list = lessons.filter((l) => l.course === s.id);
      return { id: s.id, title: c!.title, runtime: c!.runtime, count: list.length, lessons: list.map(asLesson), href: `/nclex/crash-courses/videos/${s.id}` };
    });
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
