import { NGN_COURSE } from "@/data/catalog";
import { PageHeader } from "@/components/ui/primitives";
import { CourseList } from "@/components/home/CourseList";

const LESSONS = [
  ["What Changed on the Next Gen NCLEX", "The Clinical Judgment Measurement Model", "How NGN Items Are Scored"],
  ["Reading the Case Tabs", "Recognize and Analyze Cues", "Prioritize Hypotheses", "Take Action and Evaluate Outcomes"],
  ["Full Case Walkthrough, Part 1", "Full Case Walkthrough, Part 2"],
];

export default function NgnCoursePage() {
  return (
    <>
      <PageHeader
        trail={[{ label: "Next Gen Strategy Course" }]}
        title="Next Gen Strategy Course"
        description="Learn everything you need to know about the Next Gen NCLEX. At the end, we'll walk through a full Next Gen case together."
        experts={["emily"]}
      />
      <CourseList courses={NGN_COURSE.map((c, i) => ({ id: `ngn-${i}`, title: c.title, runtime: c.runtime, lessons: LESSONS[i], freeLessons: 99 }))} />
    </>
  );
}
