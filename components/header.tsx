import Link from "next/link";

const Header = () => {
  return (
    <h2 className="text-xl font-bold tracking-tight md:tracking-tighter leading-tight">
      <Link href="/" className="hover:underline">
        Translated Document
      </Link>
    </h2>
  );
};

export default Header;
