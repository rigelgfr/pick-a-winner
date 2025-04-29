import { aboutContent } from "../data/about";
import { Card, CardContent } from '@/components/ui/card';

export default function About() {
  return (
    <div className="space-y-8">
      <section className="prose max-w-none">
        <p className="text-md leading-relaxed text-gray-700 dark:text-gray-300">
          {aboutContent.description}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aboutContent.features.map((feature, index) => (
            <Card key={index} className="bg-muted/50">
              <CardContent className="p-4">
                <h3 className="font-medium">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}