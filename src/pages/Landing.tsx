import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Code2, Sparkles, History, FileDown, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

const Landing = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Code2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">CodeReview AI</h1>
          </div>
          <div className="flex gap-3 items-center">
            <Button onClick={() => setDarkMode(!darkMode)} variant="ghost" size="icon">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button onClick={() => navigate("/auth")} variant="outline" size="lg">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              AI-Powered Code Review
              <br />
              <span className="text-primary">Made Simple</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Get instant, intelligent feedback on your code. Improve code quality, 
              learn best practices, and ship better software.
            </p>

            <div className="flex gap-4 justify-center pt-8">
              <Button onClick={() => navigate("/auth")} size="lg" className="text-lg px-8 py-6">
                Get Started
              </Button>
              <Button onClick={() => navigate("/auth")} variant="outline" size="lg" className="text-lg px-8 py-6">
                Learn More
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 pt-16">
              <div className="p-6 rounded-xl border border-border bg-card hover:border-primary transition-colors">
                <Sparkles className="h-12 w-12 text-primary mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">AI-Powered Analysis</h3>
                <p className="text-muted-foreground">
                  Advanced AI reviews your code for bugs, performance issues, and best practices
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card hover:border-primary transition-colors">
                <History className="h-12 w-12 text-primary mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">Review History</h3>
                <p className="text-muted-foreground">
                  Track all your code reviews in one place with searchable history
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card hover:border-primary transition-colors">
                <FileDown className="h-12 w-12 text-primary mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">PDF Reports</h3>
                <p className="text-muted-foreground">
                  Download professional PDF reports for documentation and sharing
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2025 CodeReview AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;