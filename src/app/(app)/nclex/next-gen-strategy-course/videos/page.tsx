import { NGN_COURSE } from "@/data/catalog";
import { PageHeader } from "@/components/ui/primitives";
import { CourseList } from "@/components/home/CourseList";

export default function NgnCoursePage() {
  const courses = NGN_COURSE.map((c, i) => ({
    id: `ngn-${i}`,
    title: c.title,
    runtime: c.runtime,
    count: c.lessons.length,
    lessons: c.lessons.map((title) => ({ type: "video" as const, title, duration: "", locked: false })),
    href: `/nclex/next-gen-strategy-course/videos/${i + 1}`,
  }));
  return (
    <>
      <PageHeader
        trail={[{ label: "Next Gen Strategy Course" }]}
        title="Next Gen Strategy Course"
        description="Learn everything you need to know about the Next Gen NCLEX. At the end, we'll walk through a full Next Gen case together."
        experts={["emily"]}
      />
      <div className="mt-4">
        <CourseList courses={courses} />
      </div>
    </>
  );
}
