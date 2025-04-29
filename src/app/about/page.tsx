import About from '@/features/about/components/About';
import FAQSection from '@/features/about/components/FAQ';

export default function AboutPage() {
  return (
    <div className="container mx-auto py-4 space-y-4">
      <h1 className="text-2xl font-bold">About pickAwinner</h1>
      <About />
      <FAQSection />
    </div>
  );
}