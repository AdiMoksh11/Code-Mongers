export default function Footer() {
  return (
    <footer className="py-8 border-t text-center text-sm">
      <p>© {new Date().getFullYear()} Credexa. All rights reserved.</p>

      <div className="flex flex-wrap justify-center gap-6 mt-4">
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="transition">GitHub</a>
        <a href="#contact" className="transition">Contact</a>

        <a href="/terms" className="transition">Terms</a>
        <a href="/privacy-policy" className="transition">Privacy</a>
        <a href="/cookies" className="transition">Cookies</a>
        <a href="/data-deletion" className="transition">Delete Account</a>
      </div>
    </footer>
  );
}
