import Logo from '@/components/Logo';
import About from '@/features/about/components/About';
import FAQSection from '@/features/about/components/FAQ';

export default function AboutPage() {
  return (
    <div className="container mx-auto py-4 space-y-4">
      <h1 className="flex text-2xl font-bold gap-2">About <Logo variant='full'/></h1>
      <About />
      <FAQSection />
    </div>
  );
}