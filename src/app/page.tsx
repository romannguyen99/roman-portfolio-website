import { Hero } from "@/sections/hero";
import { Work } from "@/sections/work";
import { Journal } from "@/sections/journal";
import { About } from "@/sections/about";
import { Contact } from "@/sections/contact";

export default function Home() {
  return (
    <main>
      <Hero />
      <Work />
      <Journal />
      <About />
      <Contact />
    </main>
  );
}
