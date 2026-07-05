import { Link } from "@/i18n/navigation";
import type { Idea } from "@/data/mock-ideas";

type IdeaCardProps = {
  idea: Idea;
};

export function IdeaCard({ idea }: IdeaCardProps) {
  return (
    <Link
      href={`/ideas/${idea.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex h-32 items-end bg-gradient-to-br from-emerald-100 via-teal-50 to-stone-100 p-4">
        <div className="flex flex-wrap gap-1.5">
          {idea.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-stone-600 backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold text-stone-900 group-hover:text-emerald-800">
          {idea.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-stone-600">
          {idea.summary}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-stone-500">
          <span>{idea.location}</span>
          <span>
            {idea.participantCount}/{idea.maxParticipants}
          </span>
        </div>
      </div>
    </Link>
  );
}
