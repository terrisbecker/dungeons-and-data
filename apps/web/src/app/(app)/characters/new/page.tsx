import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Placeholder for the character-creator wizard, which is a follow-up step.
export default function NewCharacterPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a character</CardTitle>
          <CardDescription>Character creator coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            The character-creator wizard is on its way. Check back shortly to
            build your next hero.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
