import Link from "next/link";

const Header = () => {
  return (
    <div className="container mx-auto px-5 bg-black h-12 flex items-center">
      <h2 className="text-white text-xl font-bold tracking-tight md:tracking-tighter leading-tight">
        <Link href="/" className="hover:underline">
          Translated Document
        </Link>
      </h2>
    </div>
  );
};

export default Header;
