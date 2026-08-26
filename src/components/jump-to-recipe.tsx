import { Button } from "@/components/ui/button";

export function JumpToRecipe({
  href = "#recipe",
  label = "Jump to recipe",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button render={<a href={href} />} variant="outline" className="h-11 px-5">
        {label}
      </Button>
      <p className="text-sm text-teal/75">Skip nutrition and what changed.</p>
    </div>
  );
}
