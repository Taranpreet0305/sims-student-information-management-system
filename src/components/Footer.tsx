import { Github, Linkedin } from "lucide-react";

export function Footer() {
  const developers = [
    {
      name: "Taranpreet Singh",
      github: "https://github.com/taranpreet",
      linkedin: "https://linkedin.com/in/taranpreet",
    },
    {
      name: "Prabhmeet Singh",
      github: "https://github.com/prabhmeet",
      linkedin: "https://linkedin.com/in/prabhmeet",
    },
    {
      name: "Krishna Khurana",
      github: "https://github.com/krishna",
      linkedin: "https://linkedin.com/in/krishna",
    },
  ];

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">Developed by</p>
          <div className="flex flex-wrap justify-center gap-6">
            {developers.map((dev) => (
              <div key={dev.name} className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium">{dev.name}</p>
                <div className="flex gap-2">
                  <a
                    href={dev.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                  <a
                    href={dev.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SIMS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
