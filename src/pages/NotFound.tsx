import { Link } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <SearchX className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-6xl font-bold text-foreground">404</h1>
          <p className="text-lg text-muted-foreground">
            A página que procura não foi encontrada.
          </p>
        </div>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao início
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
