export function JumpToRecipe({
  href = "#recipe",
  label = "Jump to recipe",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex w-fit text-sm font-medium text-teal underline-offset-4 hover:underline"
    >
      {label}
    </a>
  );
}
