import { LESSON_TITLES, SUBJECTS } from "@/data/catalog";
import { PageHeader } from "@/components/ui/primitives";
import { CourseList } from "@/components/home/CourseList";
import { padLessons } from "@/lib/lessons";

export default function CrashCoursesPage() {
  const courses = SUBJECTS.map((s) => ({
    id: s.id,
    title: s.name,
    runtime: s.videoRuntime,
    lessons: padLessons(LESSON_TITLES[s.id], s.lessonCount, s.name),
  }));
  return (
    <>
      <PageHeader
        trail={[{ label: "Crash Courses" }]}
        title="Crash Course Videos"
        description="Review the most tested NCLEX concepts with our videos and bite-sized quizzes! More lessons will be added weekly!"
      />
      <CourseList courses={courses} />
    </>
  );
}
