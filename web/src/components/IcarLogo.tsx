import Image from "next/image";

const LOGO_SRC = "/images/icar-logo.png";

type IcarLogoSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<IcarLogoSize, string> = {
  xs: "h-6 w-auto",
  sm: "h-8 w-auto",
  md: "h-12 w-auto",
  lg: "h-20 w-auto",
  xl: "h-28 w-auto",
};

interface IcarLogoProps {
  size?: IcarLogoSize;
  className?: string;
  priority?: boolean;
}

export default function IcarLogo({
  size = "md",
  className = "",
  priority = false,
}: IcarLogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Indian Council of Agricultural Research (ICAR)"
      width={160}
      height={200}
      priority={priority}
      className={`object-contain object-left ${sizeClasses[size]} ${className}`.trim()}
    />
  );
}
