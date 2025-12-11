import { Metadata } from 'next';
import { auth, signOut } from "@/app/(auth)/auth";

import { Navbar } from '@/components/travel/navbar';
import { History } from '@/components/travel/history';

export const metadata: Metadata = {
    title: 'travel',
};


export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    let session = await auth();
    return (
        <>
            <Navbar />
            <div className="flex flex-row ">
                <History user={session?.user} />
                {children}
            </div>
        </>
    );
}