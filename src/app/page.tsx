import { site } from "@/config/site";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-xl p-10">
      <h1 className="text-3xl font-semibold">{site.product.name}</h1>
      <p className="mt-4">{site.product.tagline}</p>
    </main>
  );
}
