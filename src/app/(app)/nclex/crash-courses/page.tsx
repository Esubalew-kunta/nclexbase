"use client";

import { useState } from "react";
import { asLesson, useCopy, useCourses, usePublished, useSubjects } from "@/lib/content";
import { courseHref } from "@/lib/routes";
import { PageHeader } from "@/components/ui/primitives";
import { CourseList, LessonFilter } from "@/components/home/CourseList";

export default function CrashCoursesPage() {
  const [filter, setFilter] = useState("");
  const copy = useCopy();
  const subjects = useSubjects();
  const courseRecs = useCourses("subject");
  const lessons = usePublished("lessons");
  // One course per visible subject, in subject order; course titles/runtimes come from Admin > Courses & Lessons.
  const courses = subjects
    .map((s) => ({ s, c: courseRecs.find((c) => c.id === s.id) }))
    .filter(({ c }) => c)
    .map(({ s, c }) => {
      const list = lessons.filter((l) => l.course === s.id);
      return { id: s.id, title: c!.title, runtime: c!.runtime, count: list.length, lessons: list.map(asLesson), href: courseHref(s.id) };
    });
  return (
    <>
      <PageHeader
        trail={[{ label: "Crash Courses" }]}
        title={copy("crash.title")}
        description={copy("crash.description")}
      />
      <div className="mt-4">
        <LessonFilter value={filter} onChange={setFilter} />
        <CourseList courses={courses} filter={filter} />
      </div>
    </>
  );
}
