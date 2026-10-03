import Effects from "@/components/Effects";
import Footer from "@/components/Footer";
import BlogHeader from "@/components/blog/BlogHeader";
import "./blog.css";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Effects />
      <BlogHeader />
      {children}
      <Footer />
    </>
  );
}
