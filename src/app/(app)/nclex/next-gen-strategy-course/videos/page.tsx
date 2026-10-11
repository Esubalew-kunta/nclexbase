"use client";

import { asLesson, useCopy, useCourses, usePublished } from "@/lib/content";
import { courseHref } from "@/lib/routes";
import { PageHeader } from "@/components/ui/primitives";
import { CourseList } from "@/components/home/CourseList";

export default function NgnCoursePage() {
  const modules = useCourses("ngn");
  const copy = useCopy();
  const lessons = usePublished("lessons");
  const courses = modules.map((c) => {
    const list = lessons.filter((l) => l.course === c.id);
    return {
      id: c.id,
      title: c.title,
      runtime: c.runtime,
      count: list.length,
      lessons: list.map(asLesson),
      href: courseHref(c.id),
    };
  });
  return (
    <>
      <PageHeader
        trail={[{ label: "Next Gen Strategy Course" }]}
        title={copy("ngn.title")}
        description={copy("ngn.description")}
      />
      <div className="mt-4">
        <CourseList courses={courses} />
      </div>
    </>
  );
}
