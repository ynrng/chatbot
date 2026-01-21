"use client";

import { CoreMessage } from "ai";
import { notFound } from "next/navigation";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/utils";
import useSWR from "swr";

export default function Page({ params }: { params: any }) {
    const { id } = params;

    let [keyword, setKeyword] = useState<string>("");


    let { data, mutate } = useSWR(`/api/wordle`, fetcher);


    const onInputChange = useCallback(async () => {
        if (!keyword) {
            return;
        }

        fetch(`/api/wordle`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: keyword,
            }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error(`Error: ${res.status} ${await res.text()}`);
                } else {

                    let r1 = await fetch(`/api/wordle`, {
                        method: "GET",
                    })
                    let data = await r1.json();
                    mutate(data);
                }
                return res.json();
            })
    }, [keyword, mutate]);

    return (
        <div>
            <div className="flex flex-col pt-12 pb-4 md:pb-8 h-dvh bg-background">

                <div className="flex flex-row justify-between items-center gap-4">
                    <Input
                        placeholder="Send a message..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.currentTarget.value)}
                        className="min-h-[24px] overflow-hidden resize-none rounded-lg text-base bg-muted border-none"
                    />
                    <Button
                        onClick={() => {
                            onInputChange();
                        }}
                    >
                        +
                    </Button>
                </div>

                {data?.map((title: any) => (
                    <div
                        className="flex flex-row  items-center gap-4"
                        key={title.id}
                        // onClick={(e) => {
                        //     console.log(title);
                        // }}
                    >

                        <div className="font-bold">{title.id}</div>
                        <div>{title.explain}</div>

                    </div>
                ))}
            </div>
        </div>
    );
}
