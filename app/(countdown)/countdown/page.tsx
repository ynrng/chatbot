"use client";

import React, { useEffect, useState } from "react";


export default function Page({ params }: { params: any }) {

    const targetDate = new Date("2025-12-27");

    const calculateRemainingDays = () => {
        const diff = targetDate.getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };


    const [daysLeft, setDaysLeft] = useState(calculateRemainingDays());

    useEffect(() => {
        // Update every 1 minute (no need to update every second if we only show days)
        const interval = setInterval(() => {
            setDaysLeft(calculateRemainingDays());
        }, 60000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return (

        <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
            <div className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">

                <span
                    className="transition-colors flex items-center justify-center text-forground gap-2 font-extrabold text-9xl w-full sm:w-auto "
                >
                    {daysLeft > 0 ? <span>
                        {daysLeft} Days Until Les Arcs
                    </span> : <span>Les Arcs was on {targetDate.toDateString()}</span>}

                </span>


            </div>
        </div>
    );
}
