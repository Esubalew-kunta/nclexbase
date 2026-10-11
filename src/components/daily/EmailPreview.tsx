import { LETTERS, emailDate } from "@/lib/daily";
import type { McqItem } from "@/lib/types";

/** The emailed Question of the Day (teal banner with gold strip, A-D list, link to the answer). */
export function EmailPreview({ item, date, link }: { item: McqItem; date: string; link: string }) {
  return (
    <div className="mx-auto w-full max-w-[480px] overflow-hidden bg-white text-left font-sans text-[14px] leading-[22px] text-exam-ink shadow-card">
      <div className="border-b-4 border-gold bg-primary px-4 py-5 text-center font-bold text-white">
        <div>NCLEX Question of the Day</div>
        <div>{emailDate(date)}</div>
      </div>
      <div className="px-4 py-5">
        {item.lead && <p className="mb-3">{item.lead}</p>}
        <div className="mb-3 [&_b]:font-bold" dangerouslySetInnerHTML={{ __html: item.stem }} />
        <ul className="my-4 list-disc space-y-1 pl-9">
          {item.options.map((o, i) => (
            <li key={i}>
              {LETTERS[i]}. {o}
            </li>
          ))}
        </ul>
        <p className="mt-6 font-bold">Click to see the answer to today&apos;s question:</p>
        <a href={link} className="break-all text-primary underline">
          {link}
        </a>
        <p className="mt-4">Challenge a friend. Forward this email to them and see if they can get it right.</p>
        <p className="mt-4">Until tomorrow,</p>
        <p className="font-bold">NCLEXBase.com</p>
      </div>
    </div>
  );
}
