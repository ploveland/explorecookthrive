import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col justify-center px-4 py-20 text-center">
      <h1 className="font-heading text-4xl text-teal">That plate is empty</h1>
      <p className="mt-3 text-teal/80">
        This page is not on the menu. Head home and thrive a recipe instead.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex justify-center text-sm font-semibold text-terracotta-strong underline-offset-4 hover:underline"
      >
        Back to Explore Cook Thrive
      </Link>
    </div>
  );
}
