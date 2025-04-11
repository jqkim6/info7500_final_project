// components/Navbar.js
import Link from "next/link";

export default function Navbar() {
    return (
        <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
            <Link href="/">
                首页
            </Link>
            <Link href="/pair">
                池详情
            </Link>
        </nav>
    );
}
