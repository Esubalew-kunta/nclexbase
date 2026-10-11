"use client";

import { asLesson, useCourses, usePublished } from "@/lib/content";
import { PageHeader } from "@/components/ui/primitives";
import { CourseList } from "@/components/home/CourseList";

export default function NgnCoursePage() {
  const modules = useCourses("ngn");
  const lessons = usePublished("lessons");
  // Module pages are generated for the seeded modules (1-3); ids look like "ngn-2".
  const courses = modules.map((c) => {
    const list = lessons.filter((l) => l.course === c.id);
    return {
      id: c.id,
      title: c.title,
      runtime: c.runtime,
      count: list.length,
      lessons: list.map(asLesson),
      href: `/nclex/next-gen-strategy-course/videos/${c.id.replace("ngn-", "")}`,
    };
  });
  return (
    <>
      <PageHeader
        trail={[{ label: "Next Gen Strategy Course" }]}
        title="Next Gen Strategy Course"
        description="Learn everything you need to know about the Next Gen NCLEX. At the end, we'll walk through a full Next Gen case together."
      />
      <div className="mt-4">
        <CourseList courses={courses} />
      </div>
    </>
  );
}
