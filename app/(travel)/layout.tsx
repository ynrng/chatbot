import { Metadata } from 'next';

// import { Navbar } from '@/components/movie/navbar';

export const metadata: Metadata = {
    title: 'travel',
};


export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            {/* <Navbar /> */}
            {children}
        </>
    );
}