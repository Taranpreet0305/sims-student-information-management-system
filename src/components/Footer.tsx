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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 mb-16 lg:mb-0">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground">Developed by</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {developers.map((dev) => (
              <div key={dev.name} className="flex flex-col items-center gap-1.5 sm:gap-2">
                <p className="text-xs sm:text-sm font-medium text-center">{dev.name}</p>
                <div className="flex gap-1.5 sm:gap-2">
                  <a
                    href={dev.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`${dev.name} GitHub`}
                  >
                    <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </a>
                  <a
                    href={dev.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`${dev.name} LinkedIn`}
                  >
                    <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
