import { Link } from "@tanstack/react-router";
import logo from "@/assets/influrax-logo.jpg";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <img
        src={logo}
        alt="InfluraX logo"
        className="h-9 w-9 rounded-lg object-cover"
      />
      <span className="font-display font-bold text-xl tracking-tight text-foreground">
        Influra<span className="text-gradient-primary">X</span>
      </span>
    </Link>
  );
}
