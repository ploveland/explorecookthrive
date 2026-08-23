import { IntakePreview } from "@/components/intake-preview";

export default function ConvertStartPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.18em] text-terracotta uppercase">
        Next up
      </p>
      <h1 className="font-heading text-4xl text-teal">We have your recipe</h1>
      <IntakePreview />
    </div>
  );
}
