"use client";

import { CoreMessage } from "ai";
import { notFound } from "next/navigation";
import React, {
    useRef,
    useEffect,
    useState,
    useCallback,
    Dispatch,
    SetStateAction,
    ChangeEvent,
} from "react";

import { toast } from "sonner";

import { auth } from "@/app/(auth)/auth";
import { Chat as PreviewChat } from "@/components/custom/chat";
import { getChatById } from "@/db/queries";
import { Chat } from "@/db/schema";
import { convertToUIMessages } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Page({ params }: { params: any }) {
    const { id } = params;

    let [keyword, setKeyword] = useState<string>("");
    let [titles, setTitles] = useState<Array<any>>([]);

    const onInputChange = useCallback(
        async () => {
            if (!keyword) {
                return;
            }
            try {
                const response = await fetch(
                    `https://api.imdbapi.dev/search/titles?query=${keyword}&limit=3`,
                );

                if (response.ok) {
                    const data = await response.json();
                    const { titles } = data;

                    // for { id, primaryTitle, primaryImage, startYear, rating } in titles:
                    console.log('22222', titles)
                    setTitles(titles);

                    // return titles;
                } else {
                    const { error } = await response.json();
                    toast.error(error);
                }

            } catch (error) {
                console.error("Error uploading files!", error);
            }
        }, [keyword, setTitles],
    );


    return (
        <div>

            <div className="flex flex-col justify-center pb-4 md:pb-8 h-dvh bg-background">
                <div> Movie Page</div>

                <div className="flex flex-row justify-between items-center gap-4">
                    <Input
                        // ref={searchRef}
                        placeholder="Send a message..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.currentTarget.value)}
                        className="min-h-[24px] overflow-hidden resize-none rounded-lg text-base bg-muted border-none"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                onInputChange();
                            }
                        }}
                    />
                    <Button onClick={() => { onInputChange(); }}
                    >+</Button>
                </div>

                {
                    titles.map((title) => (
                        <div className="flex flex-row justify-between items-center gap-4" key={title.id} onClick={(e) => { console.log(title); }}>
                            <img src={title.primaryImage ? title.primaryImage.url : null} alt={title.primaryTitle} className="w-8 h-8 rounded" />
                            <div>
                                <div className="font-bold">{title.primaryTitle}</div>
                                <div className="text-xs text-muted-foreground">{title.startYear} {title.rating ? title.rating.aggregateRating : ''}</div>
                            </div>
                        </div>
                    ))
                }

            </div>
        </div>);
}
